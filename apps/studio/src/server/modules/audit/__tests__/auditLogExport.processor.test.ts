import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupIsomerAdmin,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as mailService from "~/features/mail/service"
import * as s3Lib from "~/lib/s3"

import { getCurrentSingaporeMonth } from "~/schemas/audit"

import { db } from "../../database/database"
import { getMonthDateRange } from "../auditLogExport.query"
import { processPendingAuditLogExports } from "../auditLogExport.service"

// A fixed past month, so the stored range is the full calendar month (the
// current-month clamp is a no-op) and the expected S3 slug is deterministic.
const MONTH = "2024-03"
const AUDIT_LOG_DATE_RANGE = getMonthDateRange(MONTH, new Date()) // [2024-03-01,2024-04-01)

// Each row produces exactly one report.
type ReportType = "Access" | "Activity"

interface SeedRequestValues {
  siteId: number
  userId: string
  auditLogDateRange: string
  reportType: ReportType
  status: "Pending" | "Processing" | "Done" | "Failed"
  attempts: number
  updatedAt?: Date
  objectKey?: string
  completedAt?: Date
}

const seedRequest = async ({
  siteId,
  userId,
  reportType,
  status = "Pending",
  attempts = 0,
  updatedAt,
  auditLogDateRange = AUDIT_LOG_DATE_RANGE,
  objectKey,
  completedAt,
}: {
  siteId: number
  userId: string
  reportType: ReportType
  status?: "Pending" | "Processing" | "Done" | "Failed"
  attempts?: number
  // Override the DB-managed `updatedAt` — used to simulate a stale (or fresh)
  // `Processing` claim relative to the lease window.
  updatedAt?: Date
  auditLogDateRange?: string
  // Used to seed pre-existing Done/Failed rows directly for the reuse tests.
  objectKey?: string
  completedAt?: Date
}) => {
  const values = {
    siteId,
    userId,
    auditLogDateRange,
    reportType,
    status,
    attempts,
  } satisfies SeedRequestValues
  if (updatedAt) {
    values.updatedAt = updatedAt
  }
  if (objectKey) {
    values.objectKey = objectKey
  }
  if (completedAt) {
    values.completedAt = completedAt
  }

  return db
    .insertInto("AuditLogExportRequest")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()
}

const getRequest = async (id: string) => {
  return db
    .selectFrom("AuditLogExportRequest")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow()
}

describe("auditLogExport processor", () => {
  beforeEach(async () => {
    await resetTables(
      "AuditLogExportRequest",
      "IsomerAdmin",
      "ResourcePermission",
      "User",
      "Site",
      "AuditLog",
    )
    vi.clearAllMocks()
    vi.spyOn(s3Lib, "getStudioAssetsBucketName").mockReturnValue(
      "test-audit-bucket",
    )
    // The real upload consumes the streamed CSV body; the mock must drain it
    // too so the underlying Postgres cursor is fully read and its connection
    // released. Otherwise an unconsumed stream would leave the cursor dangling
    // across tests and could exhaust the pool.
    vi.spyOn(s3Lib, "uploadAuditLogExport").mockImplementation(
      async ({ body }) => {
        if (
          Object.prototype.toString.call(body) !== "[object String]" &&
          Symbol.asyncIterator in Object(body)
        ) {
          // SAFETY: upload body is a readable stream in the fulfilment path under test
          for await (const _chunk of body as AsyncIterable<string>) {
            // drain
          }
        }
      },
    )
    // By default every candidate artifact still exists in S3.
    vi.spyOn(s3Lib, "getFileSize").mockResolvedValue(1024)
    vi.spyOn(mailService, "sendAuditLogExportReadyEmail").mockResolvedValue(
      undefined,
    )
    vi.spyOn(mailService, "sendAuditLogExportFailedEmail").mockResolvedValue(
      undefined,
    )
  })

  it("processes an Access request: one upload with an inclusive-end key, one link, status Done", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    // A couple of permission rows so the access report is non-empty.
    const memberA = await setupUser({ email: "alice@vendor.com.sg" })
    const memberB = await setupUser({ email: "bob@vendor.com.sg" })
    await setupAdminPermissions({ userId: memberA.id, siteId: site.id })
    await setupAdminPermissions({ userId: memberB.id, siteId: site.id })

    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: the S3 key renders the half-open range [2024-03-01,2024-04-01)
    // with an inclusive end — `2024-03-01-to-2024-03-31`.
    const expectedKey = `audit-log-exports/${site.id}/${request.id}/access-2024-03-01-to-2024-03-31.csv`
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(s3Lib.uploadAuditLogExport).mock.calls[0]![0].key).toBe(expectedKey)

    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(1)
    const emailArg = vi.mocked(mailService.sendAuditLogExportReadyEmail).mock.calls[0]![0]
    // The emailed link points at the Studio redemption endpoint carrying a
    // sealed Download Token (ADR 0006), NOT a presigned S3 URL. This pins the
    // actual bug: no signing-credential-lifetime-capped amazonaws.com URL is
    // emailed anymore.
    expect(emailArg.link.label).toBe("access")
    expect(emailArg.link.url).toContain(
      "https://studio.test.gov.sg/api/audit-log-exports/download?token=",
    )
    expect(emailArg.link.url).not.toContain("amazonaws.com")
    expect(emailArg.recipientEmail).toBe("admin@vendor.com.sg")
    expect(emailArg.month).toBe("March 2024")
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
    expect(updated.objectKey).toBe(expectedKey)
    // The generate path stamps completedAt too — it is what later identical
    // requests compare against the range end to qualify this row for reuse.
    // Its value is captured BEFORE the report query, not at delivery.
    expect(updated.completedAt).not.toBeNull()
  })

  it("processes an Isomer Admin request without a site permission", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "isomer-admin@open.gov.sg" })
    await setupIsomerAdmin({ userId: admin.id })
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: admin.email }),
    )
    expect((await getRequest(request.id)).status).toBe("Done")
  })

  it("marks the row Done BEFORE sending the ready email, so the emailed token is already live", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "ordering@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Capture the row's state at the exact moment the email goes out: if the
    // send ever moves back ahead of the Done UPDATE, a recipient clicking
    // immediately hits the download route's status guard and sees "expired".
    let statusAtSendTime: string | null = null
    let completedAtSendTime: Date | null = null
    vi.mocked(mailService.sendAuditLogExportReadyEmail).mockImplementation(async () => {
      const row = await getRequest(request.id)
      statusAtSendTime = row.status
      completedAtSendTime = row.completedAt
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(1)
    expect(statusAtSendTime).toBe("Done")
    expect(completedAtSendTime).not.toBeNull()
  })

  it("re-queues a row whose ready email failed, even though it was already marked Done", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "sesdown@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })
    vi.mocked(mailService.sendAuditLogExportReadyEmail).mockRejectedValue(new Error("ses down"))

    // Act
    await processPendingAuditLogExports()

    // Assert: the Done UPDATE ran first, but the catch re-queues so a later
    // sweep retries the send; that retry re-marks the row Done, which makes
    // the same requestId's token live again. No failure email on attempt 1.
    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Pending")
    expect(updated.attempts).toBe(1)
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()
  })

  it("processes two independent pending rows in one sweep: two uploads, two single-link emails, both Done", async () => {
    // Arrange: an Access row and an Activity row for the same site, each
    // fulfilled as its own job with its own email — no cross-job coordination.
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin2@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const accessRequest = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })
    const activityRequest = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Activity",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: two uploads and two independent ready emails, each with exactly
    // one link (no cross-job coordination).
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(2)
    const labels = vi.mocked(mailService.sendAuditLogExportReadyEmail).mock.calls
      .map(([arg]) => arg.link.label)
      .sort()
    expect(labels).toEqual(["access", "audit"])

    const updatedAccess = await getRequest(accessRequest.id)
    expect(updatedAccess.status).toBe("Done")
    expect(updatedAccess.objectKey).toBe(
      `audit-log-exports/${site.id}/${accessRequest.id}/access-2024-03-01-to-2024-03-31.csv`,
    )

    const updatedActivity = await getRequest(activityRequest.id)
    expect(updatedActivity.status).toBe("Done")
    expect(updatedActivity.objectKey).toBe(
      `audit-log-exports/${site.id}/${activityRequest.id}/activity-2024-03-01-to-2024-03-31.csv`,
    )
  })

  it("uploads a header-only CSV and sends the ready email when there are no results", async () => {
    // Arrange: the admin's permission is granted (MOCK_STORY_DATE) after
    // AUDIT_LOG_DATE_RANGE's end, so the access report for that older range
    // is empty — while the permission stays active (not deleted), so the
    // admin is still found as a valid recipient for the ready email.
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin3@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(1)

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
  })

  it("retries on failure and only fails (with email) after the third attempt", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin4@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    vi.mocked(s3Lib.uploadAuditLogExport).mockRejectedValue(new Error("s3 down"))

    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Act: first sweep → attempt 1, re-queued, no failed email.
    await processPendingAuditLogExports()

    // Assert
    let updated = await getRequest(request.id)
    expect(updated.attempts).toBe(1)
    expect(updated.status).toBe("Pending")
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()

    // Act: second sweep → attempt 2, still re-queued.
    await processPendingAuditLogExports()
    updated = await getRequest(request.id)
    expect(updated.attempts).toBe(2)
    expect(updated.status).toBe("Pending")
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()

    // Act: third sweep → attempt 3, Failed + failed email sent.
    await processPendingAuditLogExports()
    updated = await getRequest(request.id)
    expect(updated.attempts).toBe(3)
    expect(updated.status).toBe("Failed")
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).toHaveBeenCalledTimes(1)
    const failedArg = vi.mocked(mailService.sendAuditLogExportFailedEmail).mock.calls[0]![0]
    expect(failedArg.recipientEmail).toBe("admin4@vendor.com.sg")
    // The failure email's month label derives from the daterange lower bound.
    expect(failedArg.month).toBe("March 2024")

    // The ready email must never have been sent.
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).not.toHaveBeenCalled()
  })

  it("does not reprocess a request that is not Pending", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin5@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const doneRequest = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
      status: "Done",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: a Done row is never claimed, so no S3/mail work happens for it.
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).not.toHaveBeenCalled()
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).not.toHaveBeenCalled()

    const updated = await getRequest(doneRequest.id)
    expect(updated.status).toBe("Done")
  })

  it("re-claims and processes a stale Processing row (abandoned claim) to Done", async () => {
    // Arrange: a row stuck in Processing with an `updatedAt` well past the
    // 15-minute lease — simulating a worker that died after claiming it but
    // before the ready email / mark-Done. A later sweep must recover it.
    const { site } = await setupSite()
    const admin = await setupUser({ email: "stale@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const staleUpdatedAt = new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
      status: "Processing",
      updatedAt: staleUpdatedAt,
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: the stale row was re-claimed, processed, and finished.
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
    expect(updated.objectKey).not.toBeNull()
    // Re-claiming a stale row counts as a fresh attempt.
    expect(updated.attempts).toBe(1)
  })

  it("charges a stale re-claim that fails exactly one attempt, not two", async () => {
    // Arrange: a stale Processing row that has already burned one attempt.
    // The re-claim charges attempt 2 at claim time; when processing then
    // fails, the catch must NOT add another increment — the row still has a
    // retry left, so it is re-queued rather than Failed. (Regression: the
    // catch used to add 1 to the post-claim value, jumping 1 → 3 and
    // skipping the middle retry entirely.)
    const { site } = await setupSite()
    const admin = await setupUser({ email: "stalefail@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    vi.mocked(s3Lib.uploadAuditLogExport).mockRejectedValue(new Error("s3 down"))

    const staleUpdatedAt = new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
      status: "Processing",
      attempts: 1,
      updatedAt: staleUpdatedAt,
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: one attempt charged (1 → 2), re-queued with a retry remaining.
    const updated = await getRequest(request.id)
    expect(updated.attempts).toBe(2)
    expect(updated.status).toBe("Pending")
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()
  })

  it("does not touch a fresh Processing row within the lease window", async () => {
    // Arrange: a row currently Processing whose `updatedAt` is recent (a live
    // worker is presumably still on it). A concurrent sweep must leave it alone.
    const { site } = await setupSite()
    const admin = await setupUser({ email: "fresh@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const freshUpdatedAt = new Date(Date.now() - 60 * 1000) // 1 min ago
    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
      status: "Processing",
      updatedAt: freshUpdatedAt,
    })

    // Act
    await processPendingAuditLogExports()

    // Assert: no work happened and the row is untouched.
    expect(vi.mocked(s3Lib.uploadAuditLogExport)).not.toHaveBeenCalled()
    expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).not.toHaveBeenCalled()
    expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Processing")
    expect(updated.attempts).toBe(0)
    // `updatedAt` must not have moved (not re-claimed).
    expect(updated.updatedAt.getTime()).toBe(freshUpdatedAt.getTime())
  })

  // Complete-Artifact reuse (ADR docs/adr/0005): an identical (site, range,
  // report type) request is fulfilled by re-delivering an existing Done row's
  // artifact — with a fresh signed URL and email — instead of regenerating,
  // provided that artifact's data was frozen (completedAt, captured pre-query
  // on the generate path) AFTER the range fully elapsed and the S3 object
  // still exists.
  describe("Complete-Artifact reuse", () => {
    it("reuses the Done artifact of an identical past-range request from ANOTHER user (per-site reuse, no second upload)", async () => {
      // Arrange: first admin's request is processed to Done normally.
      const { site } = await setupSite()
      const firstAdmin = await setupUser({ email: "first@vendor.com.sg" })
      await setupAdminPermissions({ userId: firstAdmin.id, siteId: site.id })
      const first = await seedRequest({
        siteId: site.id,
        userId: firstAdmin.id,
        reportType: "Access",
      })
      await processPendingAuditLogExports()
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)

      // A SECOND admin asks for the same (site, range, type): the artifact is
      // a function of (site, range, type) only, so their request qualifies.
      const secondAdmin = await setupUser({ email: "second@vendor.com.sg" })
      await setupAdminPermissions({ userId: secondAdmin.id, siteId: site.id })
      const second = await seedRequest({
        siteId: site.id,
        userId: secondAdmin.id,
        reportType: "Access",
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: ONE upload across both requests — the second run reused the
      // first artifact's key and only re-signed + re-emailed it.
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
      const updatedFirst = await getRequest(first.id)
      const updatedSecond = await getRequest(second.id)
      expect(updatedSecond.status).toBe("Done")
      expect(updatedSecond.objectKey).toBe(updatedFirst.objectKey)
      expect(updatedSecond.completedAt).not.toBeNull()
      expect(updatedSecond.errorMessage).toBeNull()

      // A fresh ready email went to the SECOND requester.
      expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(2)
      const secondEmail = vi.mocked(mailService.sendAuditLogExportReadyEmail).mock.calls[1]![0]
      expect(secondEmail.recipientEmail).toBe("second@vendor.com.sg")
      // Reuse still emails a Download Token link (against the reused row's own
      // token), never a presigned S3 URL.
      expect(secondEmail.link.label).toBe("access")
      expect(secondEmail.link.url).toContain(
        "https://studio.test.gov.sg/api/audit-log-exports/download?token=",
      )
      expect(secondEmail.link.url).not.toContain("amazonaws.com")
      expect(vi.mocked(mailService.sendAuditLogExportFailedEmail)).not.toHaveBeenCalled()
    })

    it("does NOT reuse an in-progress-month snapshot (completedAt before the range end)", async () => {
      // Arrange: a CURRENT-month request stores a clamped range whose end
      // instant is still in the future, so its Done row is a point-in-time
      // snapshot (completedAt < rangeEnd) — never a Complete Artifact.
      const currentMonthRange = getMonthDateRange(
        getCurrentSingaporeMonth(),
        new Date(),
      )
      const { site } = await setupSite()
      const admin = await setupUser({ email: "snapshot@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const first = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        auditLogDateRange: currentMonthRange,
      })
      await processPendingAuditLogExports()
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)

      const second = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        auditLogDateRange: currentMonthRange,
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: the snapshot was regenerated, not reused — a second upload
      // under the second request's own key.
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(2)
      const updatedFirst = await getRequest(first.id)
      const updatedSecond = await getRequest(second.id)
      expect(updatedSecond.status).toBe("Done")
      expect(updatedSecond.objectKey).not.toBe(updatedFirst.objectKey)
      expect(updatedSecond.objectKey).toContain(`/${second.id}/`)
    })

    it("stamps completedAt with the pre-query instant, not delivery time (query and finish can straddle the range end)", async () => {
      // Arrange: the midnight race. A current-month job that queries before
      // SGT midnight is missing the tail of the month; if completedAt were
      // stamped when the job FINISHES (after upload/email/retries cross the
      // boundary), the row would satisfy `completedAt >= rangeEnd` and
      // masquerade as a Complete Artifact forever. The fix stamps completedAt
      // with an instant captured BEFORE the report query — prove it by making
      // delivery measurably slower than the query and checking the stamp.
      const { site } = await setupSite()
      const admin = await setupUser({ email: "straddle@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })
      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      let uploadStartedAt: Date | undefined
      vi.mocked(s3Lib.uploadAuditLogExport).mockImplementationOnce(async () => {
        uploadStartedAt = new Date()
        // Real delay so delivery time is measurably after the query instant.
        await new Promise((resolve) => setTimeout(resolve, 25))
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: completedAt is at or before the moment upload began (the
      // pre-query freeze instant), and strictly before the post-delivery
      // updatedAt stamp — never the delivery-time clock.
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Done")
      expect(updated.completedAt).not.toBeNull()
      expect(uploadStartedAt).toBeDefined()
      expect(updated.completedAt!.getTime()).toBeLessThanOrEqual(
        uploadStartedAt!.getTime(),
      )
      expect(updated.completedAt!.getTime()).toBeLessThan(
        updated.updatedAt.getTime(),
      )
    })

    it("does NOT reuse a Failed row even if it carries an objectKey and a qualifying completedAt", async () => {
      // Arrange: a Failed row that (pathologically) has both an objectKey and
      // a completedAt after the range end — status must still disqualify it.
      const { site } = await setupSite()
      const admin = await setupUser({ email: "failed@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const failedKey = `audit-log-exports/${site.id}/999/access-2024-03-01-to-2024-03-31.csv`
      await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        status: "Failed",
        objectKey: failedKey,
        completedAt: new Date(),
      })

      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: generated fresh under this request's own key.
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Done")
      expect(updated.objectKey).toContain(`/${request.id}/`)
      expect(updated.objectKey).not.toBe(failedKey)
    })

    it("falls back to generation when the reusable artifact's S3 object is gone", async () => {
      // Arrange: a qualifying Done row exists, but the HeadObject probe says
      // the object has vanished (e.g. a lifecycle policy deleted it).
      const { site } = await setupSite()
      const admin = await setupUser({ email: "vanished@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const goneKey = `audit-log-exports/${site.id}/998/access-2024-03-01-to-2024-03-31.csv`
      await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        status: "Done",
        objectKey: goneKey,
        completedAt: new Date(),
      })
      vi.mocked(s3Lib.getFileSize).mockResolvedValue(null)

      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: the existence check ran against the candidate, found nothing,
      // and the report was regenerated + uploaded under a fresh key.
      expect(vi.mocked(s3Lib.getFileSize)).toHaveBeenCalledWith({
        Bucket: "test-audit-bucket",
        Key: goneKey,
      })
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).toHaveBeenCalledTimes(1)
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Done")
      expect(updated.objectKey).toContain(`/${request.id}/`)
      expect(updated.objectKey).not.toBe(goneKey)
      expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).toHaveBeenCalledTimes(1)
    })

    it("re-queues (Pending) without regenerating when the existence probe hits a transient S3 error", async () => {
      // Arrange: a qualifying Done row exists, but the HeadObject probe fails
      // with a transient (non-404) error — getFileSize rethrows it rather than
      // reporting the object as gone, so the attempt must fail-and-requeue, NOT
      // regenerate. A blip must never be mistaken for a vanished artifact.
      const { site } = await setupSite()
      const admin = await setupUser({ email: "throttled@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const reusableKey = `audit-log-exports/${site.id}/997/access-2024-03-01-to-2024-03-31.csv`
      await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        status: "Done",
        objectKey: reusableKey,
        completedAt: new Date(),
      })
      const transientError = Object.assign(new Error("SlowDown"), {
        name: "SlowDown",
        $metadata: { httpStatusCode: 503 },
      })
      vi.mocked(s3Lib.getFileSize).mockRejectedValue(transientError)

      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      // Act
      await processPendingAuditLogExports()

      // Assert: the probe ran, but the transient failure short-circuited the
      // attempt — no regeneration, no upload, no email — and the row is left
      // Pending for the next sweep.
      expect(vi.mocked(s3Lib.getFileSize)).toHaveBeenCalledWith({
        Bucket: "test-audit-bucket",
        Key: reusableKey,
      })
      expect(vi.mocked(s3Lib.uploadAuditLogExport)).not.toHaveBeenCalled()
      expect(vi.mocked(mailService.sendAuditLogExportReadyEmail)).not.toHaveBeenCalled()
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Pending")
      expect(updated.objectKey).toBeNull()
    })
  })
})
