import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupIsomerAdmin,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"

interface ReadyEmailArg {
  recipientEmail: string
  siteName: string
  month: string
  link: { label: "access" | "audit"; url: string }
}

interface FailedEmailArg {
  recipientEmail: string
  siteName: string
  month: string
}

const {
  mockUploadAuditLogExport,
  mockGetStudioAssetsBucketName,
  mockGetFileSize,
  mockSendAuditLogExportReadyEmail,
  mockSendAuditLogExportFailedEmail,
} = vi.hoisted(() => ({
  mockUploadAuditLogExport:
    vi.fn<(args: { key: string; body: unknown }) => Promise<void>>(),
  mockGetStudioAssetsBucketName: vi.fn<() => string>(),
  // HeadObject-backed existence probe used by the Complete-Artifact reuse
  // fork: a byte size means the object exists, null means it is gone.
  mockGetFileSize: vi.fn<() => Promise<number | null>>(),
  mockSendAuditLogExportReadyEmail:
    vi.fn<(data: ReadyEmailArg) => Promise<void>>(),
  mockSendAuditLogExportFailedEmail:
    vi.fn<(data: FailedEmailArg) => Promise<void>>(),
}))

// `~/lib/s3` (mocked below) is the only thing in this service's import chain
// that requires `S3_STUDIO_ASSETS_BUCKET_NAME`, and `~/lib/logger` only
// reads NODE_ENV / NEXT_PUBLIC_APP_ENV. The DB still needs the real connection
// string, which dotenv-cli has already loaded into `process.env` from
// `.env.test`. We bypass the validated env schema (which would reject the
// missing audit-bucket var) and read what we need straight from `process.env`.
vi.mock(import('~/env.mjs'), () => ({
  env: {
    // oxlint-disable-next-line node/no-process-env
    NODE_ENV: process.env.NODE_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    DATABASE_URL: process.env.DATABASE_URL,
    S3_STUDIO_ASSETS_BUCKET_NAME: "test-audit-bucket",
    // The emailed download link is `${NEXT_PUBLIC_APP_URL}/api/...` and the
    // Download Token is sealed with SESSION_SECRET — both are read via the
    // fulfilment path now, so the mocked env must supply them.
    NEXT_PUBLIC_APP_URL: "https://studio.test.gov.sg",
    SESSION_SECRET: "test-session-secret-at-least-32-chars-long",
  },
}))

// Mock only the external boundaries (S3 + mail). The DB is NOT mocked — the
// request rows, sites, users and permissions are seeded into a real Postgres.
// Fulfilment no longer presigns at export time (it emails a sealed Download
// Token instead — ADR 0006), so generateSignedGetUrl is no longer part of
// this path and is not mocked here.
vi.mock(import('~/lib/s3'), () => ({
  uploadAuditLogExport: mockUploadAuditLogExport,
  getStudioAssetsBucketName: mockGetStudioAssetsBucketName,
  getFileSize: mockGetFileSize,
}))

vi.mock(import('~/features/mail/service'), () => ({
  sendAuditLogExportReadyEmail: mockSendAuditLogExportReadyEmail,
  sendAuditLogExportFailedEmail: mockSendAuditLogExportFailedEmail,
}))

import { getCurrentSingaporeMonth } from "~/schemas/audit"

import { db } from "../../database"
import { getMonthDateRange } from "../auditLogExport.query"
import { processPendingAuditLogExports } from "../auditLogExport.service"

// A fixed past month, so the stored range is the full calendar month (the
// current-month clamp is a no-op) and the expected S3 slug is deterministic.
const MONTH = "2024-03"
const AUDIT_LOG_DATE_RANGE = getMonthDateRange(MONTH, new Date()) // [2024-03-01,2024-04-01)

// Each row produces exactly one report.
type ReportType = "Access" | "Activity"

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
  return db
    .insertInto("AuditLogExportRequest")
    .values({
      siteId,
      userId,
      auditLogDateRange,
      reportType,
      status,
      attempts,
      ...(updatedAt ? { updatedAt } : {}),
      ...(objectKey ? { objectKey } : {}),
      ...(completedAt ? { completedAt } : {}),
    })
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
    mockGetStudioAssetsBucketName.mockReturnValue("test-audit-bucket")
    // The real upload consumes the streamed CSV body; the mock must drain it
    // too so the underlying Postgres cursor is fully read and its connection
    // released. Otherwise an unconsumed stream would leave the cursor dangling
    // across tests and could exhaust the pool.
    mockUploadAuditLogExport.mockImplementation(async ({ body }) => {
      if (typeof body !== "string" && Symbol.asyncIterator in Object(body)) {
        for await (const _chunk of body as AsyncIterable<unknown>) {
          // drain
        }
      }
    })
    // By default every candidate artifact still exists in S3.
    mockGetFileSize.mockResolvedValue(1024)
    mockSendAuditLogExportReadyEmail.mockResolvedValue(undefined)
    mockSendAuditLogExportFailedEmail.mockResolvedValue(undefined)
  })

  describe("processes an Access request: one upload with an inclusive-end key, one link, status Done", () => {
    const expectedKey = (requestId: string, siteId: number) =>
      `audit-log-exports/${siteId}/${requestId}/access-2024-03-01-to-2024-03-31.csv`
    let request: Awaited<ReturnType<typeof seedRequest>>
    let siteId: number
    let emailArg: ReadyEmailArg
    let updated: Awaited<ReturnType<typeof getRequest>>

    beforeEach(async () => {
      const { site } = await setupSite()
      siteId = site.id
      const admin = await setupUser({ email: "admin@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })
      const memberA = await setupUser({ email: "alice@vendor.com.sg" })
      const memberB = await setupUser({ email: "bob@vendor.com.sg" })
      await setupAdminPermissions({ userId: memberA.id, siteId: site.id })
      await setupAdminPermissions({ userId: memberB.id, siteId: site.id })

      request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      await processPendingAuditLogExports()

      emailArg = mockSendAuditLogExportReadyEmail.mock.calls[0]![0]
      updated = await getRequest(request.id)
    })

    it("uploads to S3 with the correct inclusive-end key", () => {
      expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
      expect(mockUploadAuditLogExport.mock.calls[0]![0].key).toBe(
        expectedKey(request.id, siteId),
      )
    })

    it("sends a ready email with a download token link", () => {
      expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledOnce()
      expect(emailArg).toMatchObject({
        link: expect.objectContaining({
          label: "access",
          url: expect.stringContaining(
            "https://studio.test.gov.sg/api/audit-log-exports/download?token=",
          ),
        }),
        recipientEmail: "admin@vendor.com.sg",
        month: "March 2024",
      })
      expect(emailArg.link.url).not.toContain("amazonaws.com")
    })

    it("does not send a failed email", () => {
      expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
    })

    it("marks the request Done with the object key", () => {
      expect(updated).toStrictEqual(
        expect.objectContaining({
          status: "Done",
          objectKey: expectedKey(request.id, siteId),
          completedAt: expect.any(Date),
        }),
      )
    })
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
    expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledWith(
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
    mockSendAuditLogExportReadyEmail.mockImplementation(async () => {
      const row = await getRequest(request.id)
      statusAtSendTime = row.status
      completedAtSendTime = row.completedAt
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledOnce()
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
    mockSendAuditLogExportReadyEmail.mockRejectedValue(new Error("ses down"))

    // Act
    await processPendingAuditLogExports()

    // Assert: the Done UPDATE ran first, but the catch re-queues so a later
    // sweep retries the send; that retry re-marks the row Done, which makes
    // the same requestId's token live again. No failure email on attempt 1.
    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Pending")
    expect(updated.attempts).toBe(1)
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
  })

  describe("processes two independent pending rows in one sweep: two uploads, two single-link emails, both Done", () => {
    let siteId: number
    let accessRequest: Awaited<ReturnType<typeof seedRequest>>
    let activityRequest: Awaited<ReturnType<typeof seedRequest>>
    let updatedAccess: Awaited<ReturnType<typeof getRequest>>
    let updatedActivity: Awaited<ReturnType<typeof getRequest>>

    beforeEach(async () => {
      const { site } = await setupSite()
      siteId = site.id
      const admin = await setupUser({ email: "admin2@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      accessRequest = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })
      activityRequest = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Activity",
      })

      await processPendingAuditLogExports()

      updatedAccess = await getRequest(accessRequest.id)
      updatedActivity = await getRequest(activityRequest.id)
    })

    it("uploads both reports and emails each with a single link", () => {
      expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(2)
      expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(2)
      const labels = mockSendAuditLogExportReadyEmail.mock.calls
        .map(([arg]) => arg.link.label)
        .sort()
      expect(labels).toStrictEqual(["access", "audit"])
    })

    it("marks the Access request Done with the correct object key", () => {
      expect(updatedAccess.status).toBe("Done")
      expect(updatedAccess.objectKey).toBe(
        `audit-log-exports/${siteId}/${accessRequest.id}/access-2024-03-01-to-2024-03-31.csv`,
      )
    })

    it("marks the Activity request Done with the correct object key", () => {
      expect(updatedActivity.status).toBe("Done")
      expect(updatedActivity.objectKey).toBe(
        `audit-log-exports/${siteId}/${activityRequest.id}/activity-2024-03-01-to-2024-03-31.csv`,
      )
    })
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
    expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledOnce()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
  })

  describe("retries on failure and only fails (with email) after the third attempt", () => {
    let request: Awaited<ReturnType<typeof seedRequest>>
    let updatedAfterFirstSweep: Awaited<ReturnType<typeof getRequest>>
    let updatedAfterSecondSweep: Awaited<ReturnType<typeof getRequest>>
    let updatedAfterThirdSweep: Awaited<ReturnType<typeof getRequest>>
    let failedArg: FailedEmailArg

    beforeEach(async () => {
      const { site } = await setupSite()
      const admin = await setupUser({ email: "admin4@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })
      mockUploadAuditLogExport.mockRejectedValue(new Error("s3 down"))

      request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
      })

      await processPendingAuditLogExports()
      updatedAfterFirstSweep = await getRequest(request.id)

      await processPendingAuditLogExports()
      updatedAfterSecondSweep = await getRequest(request.id)

      await processPendingAuditLogExports()
      updatedAfterThirdSweep = await getRequest(request.id)
      failedArg = mockSendAuditLogExportFailedEmail.mock.calls[0]![0]
    })

    it("re-queues after the first attempt without sending a failed email", () => {
      expect(updatedAfterFirstSweep.attempts).toBe(1)
      expect(updatedAfterFirstSweep.status).toBe("Pending")
      expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
    })

    it("re-queues after the second attempt without sending a failed email", () => {
      expect(updatedAfterSecondSweep.attempts).toBe(2)
      expect(updatedAfterSecondSweep.status).toBe("Pending")
      expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
    })

    it("marks the request Failed and sends a failed email after the third attempt", () => {
      expect(updatedAfterThirdSweep.attempts).toBe(3)
      expect(updatedAfterThirdSweep.status).toBe("Failed")
      expect(mockSendAuditLogExportFailedEmail).toHaveBeenCalledOnce()
      expect(failedArg.recipientEmail).toBe("admin4@vendor.com.sg")
      expect(failedArg.month).toBe("March 2024")
    })

    it("never sends a ready email", () => {
      expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()
    })
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
    expect(mockUploadAuditLogExport).not.toHaveBeenCalled()
    expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()

    const updated = await getRequest(doneRequest.id)
    expect(updated.status).toBe("Done")
  })

  describe("re-claims and processes a stale Processing row (abandoned claim) to Done", () => {
    let updated: Awaited<ReturnType<typeof getRequest>>

    beforeEach(async () => {
      const { site } = await setupSite()
      const admin = await setupUser({ email: "stale@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const staleUpdatedAt = new Date(Date.now() - 30 * 60 * 1000)
      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        status: "Processing",
        updatedAt: staleUpdatedAt,
      })

      await processPendingAuditLogExports()
      updated = await getRequest(request.id)
    })

    it("uploads the report and sends a ready email", () => {
      expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
      expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledOnce()
      expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
    })

    it("marks the request Done with an object key", () => {
      expect(updated.status).toBe("Done")
      expect(updated.objectKey).not.toBeNull()
    })

    it("charges one attempt for the re-claim", () => {
      expect(updated.attempts).toBe(1)
    })
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
    mockUploadAuditLogExport.mockRejectedValue(new Error("s3 down"))

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
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
  })

  describe("does not touch a fresh Processing row within the lease window", () => {
    const freshUpdatedAt = new Date(Date.now() - 60 * 1000)
    let updated: Awaited<ReturnType<typeof getRequest>>

    beforeEach(async () => {
      const { site } = await setupSite()
      const admin = await setupUser({ email: "fresh@vendor.com.sg" })
      await setupAdminPermissions({ userId: admin.id, siteId: site.id })

      const request = await seedRequest({
        siteId: site.id,
        userId: admin.id,
        reportType: "Access",
        status: "Processing",
        updatedAt: freshUpdatedAt,
      })

      await processPendingAuditLogExports()
      updated = await getRequest(request.id)
    })

    it("does not upload or send any emails", () => {
      expect(mockUploadAuditLogExport).not.toHaveBeenCalled()
      expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()
      expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
    })

    it("leaves the row in Processing with no new attempts", () => {
      expect(updated.status).toBe("Processing")
      expect(updated.attempts).toBe(0)
    })

    it("does not update the row timestamp", () => {
      expect(updated.updatedAt.getTime()).toBe(freshUpdatedAt.getTime())
    })
  })

  // Complete-Artifact reuse (ADR docs/adr/0005): an identical (site, range,
  // report type) request is fulfilled by re-delivering an existing Done row's
  // artifact — with a fresh signed URL and email — instead of regenerating,
  // provided that artifact's data was frozen (completedAt, captured pre-query
  // on the generate path) AFTER the range fully elapsed and the S3 object
  // still exists.
  describe("Complete-Artifact reuse", () => {

    describe("reuses the Done artifact of an identical past-range request from ANOTHER user (per-site reuse, no second upload)", () => {
      let updatedFirst: Awaited<ReturnType<typeof getRequest>>
      let updatedSecond: Awaited<ReturnType<typeof getRequest>>
      let secondEmail: ReadyEmailArg

      beforeEach(async () => {
        const { site } = await setupSite()
        const firstAdmin = await setupUser({ email: "first@vendor.com.sg" })
        await setupAdminPermissions({ userId: firstAdmin.id, siteId: site.id })
        const first = await seedRequest({
          siteId: site.id,
          userId: firstAdmin.id,
          reportType: "Access",
        })
        await processPendingAuditLogExports()

        const secondAdmin = await setupUser({ email: "second@vendor.com.sg" })
        await setupAdminPermissions({ userId: secondAdmin.id, siteId: site.id })
        const second = await seedRequest({
          siteId: site.id,
          userId: secondAdmin.id,
          reportType: "Access",
        })

        await processPendingAuditLogExports()

        updatedFirst = await getRequest(first.id)
        updatedSecond = await getRequest(second.id)
        secondEmail = mockSendAuditLogExportReadyEmail.mock.calls[1]![0]
      })

      it("reuses the first artifact without a second upload", () => {
        expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
        expect(updatedSecond.status).toBe("Done")
        expect(updatedSecond.objectKey).toBe(updatedFirst.objectKey)
        expect(updatedSecond.completedAt).not.toBeNull()
        expect(updatedSecond.errorMessage).toBeNull()
      })

      it("sends a fresh ready email to the second requester", () => {
        expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(2)
        expect(secondEmail.recipientEmail).toBe("second@vendor.com.sg")
        expect(secondEmail.link.label).toBe("access")
        expect(secondEmail.link.url).toContain(
          "https://studio.test.gov.sg/api/audit-log-exports/download?token=",
        )
        expect(secondEmail.link.url).not.toContain("amazonaws.com")
      })

      it("does not send a failed email", () => {
        expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()
      })
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
      expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()

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
      expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(2)
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
      mockUploadAuditLogExport.mockImplementationOnce(async () => {
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
      expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Done")
      expect(updated.objectKey).toContain(`/${request.id}/`)
      expect(updated.objectKey).not.toBe(failedKey)
    })

    describe("falls back to generation when the reusable artifact's S3 object is gone", () => {
      let siteId: number
      let goneKey: string
      let request: Awaited<ReturnType<typeof seedRequest>>
      let updated: Awaited<ReturnType<typeof getRequest>>

      beforeEach(async () => {
        const { site } = await setupSite()
        siteId = site.id
        goneKey = `audit-log-exports/${siteId}/998/access-2024-03-01-to-2024-03-31.csv`
        const admin = await setupUser({ email: "vanished@vendor.com.sg" })
        await setupAdminPermissions({ userId: admin.id, siteId: site.id })

        await seedRequest({
          siteId: site.id,
          userId: admin.id,
          reportType: "Access",
          status: "Done",
          objectKey: goneKey,
          completedAt: new Date(),
        })
        mockGetFileSize.mockResolvedValue(null)

        request = await seedRequest({
          siteId: site.id,
          userId: admin.id,
          reportType: "Access",
        })

        await processPendingAuditLogExports()
        updated = await getRequest(request.id)
      })

      it("checks S3 for the candidate artifact and regenerates when it is missing", () => {
        expect(mockGetFileSize).toHaveBeenCalledWith({
          Bucket: "test-audit-bucket",
          Key: goneKey,
        })
        expect(mockUploadAuditLogExport).toHaveBeenCalledOnce()
      })

      it("marks the request Done under a fresh object key", () => {
        expect(updated.status).toBe("Done")
        expect(updated.objectKey).toContain(`/${request.id}/`)
        expect(updated.objectKey).not.toBe(goneKey)
      })

      it("sends a ready email", () => {
        expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledOnce()
      })
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
      mockGetFileSize.mockRejectedValue(transientError)

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
      expect(mockGetFileSize).toHaveBeenCalledWith({
        Bucket: "test-audit-bucket",
        Key: reusableKey,
      })
      expect(mockUploadAuditLogExport).not.toHaveBeenCalled()
      expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()
      const updated = await getRequest(request.id)
      expect(updated.status).toBe("Pending")
      expect(updated.objectKey).toBeNull()
    })
  })
})
