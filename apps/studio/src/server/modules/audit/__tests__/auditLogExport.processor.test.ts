import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
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
  mockGenerateSignedGetUrl,
  mockGetStudioAssetsBucketName,
  mockSendAuditLogExportReadyEmail,
  mockSendAuditLogExportFailedEmail,
} = vi.hoisted(() => ({
  mockUploadAuditLogExport:
    vi.fn<(args: { key: string; body: unknown }) => Promise<void>>(),
  mockGenerateSignedGetUrl: vi.fn<() => Promise<string>>(),
  mockGetStudioAssetsBucketName: vi.fn<() => string>(),
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
vi.mock("~/env.mjs", () => ({
  env: {
    // oxlint-disable-next-line node/no-process-env
    NODE_ENV: process.env.NODE_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    DATABASE_URL: process.env.DATABASE_URL,
    S3_STUDIO_ASSETS_BUCKET_NAME: "test-audit-bucket",
  },
}))

// Mock only the external boundaries (S3 + mail). The DB is NOT mocked — the
// request rows, sites, users and permissions are seeded into a real Postgres.
vi.mock("~/lib/s3", () => ({
  uploadAuditLogExport: mockUploadAuditLogExport,
  generateSignedGetUrl: mockGenerateSignedGetUrl,
  getStudioAssetsBucketName: mockGetStudioAssetsBucketName,
  AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS: 60 * 60 * 24 * 3,
}))

vi.mock("~/features/mail/service", () => ({
  sendAuditLogExportReadyEmail: mockSendAuditLogExportReadyEmail,
  sendAuditLogExportFailedEmail: mockSendAuditLogExportFailedEmail,
}))

import { db } from "../../database"
import { getMonthDateRange } from "../auditLogExport.query"
import { processPendingAuditLogExports } from "../auditLogExport.service"

// A fixed past month, so the stored range is the full calendar month (the
// current-month clamp is a no-op) and the expected S3 slug is deterministic.
const MONTH = "2024-03"
const AUDIT_LOG_DATE_RANGE = getMonthDateRange(MONTH, new Date()) // [2024-03-01,2024-04-01)

// Each row produces exactly one report; `Both` no longer exists at the DB
// layer (a "Both" user request is fanned out into one row per type).
type ReportType = "Access" | "Activity"

const seedRequest = async ({
  siteId,
  userId,
  reportType,
  status = "Pending",
  attempts = 0,
  updatedAt,
}: {
  siteId: number
  userId: string
  reportType: ReportType
  status?: "Pending" | "Processing" | "Done" | "Failed"
  attempts?: number
  // Override the DB-managed `updatedAt` — used to simulate a stale (or fresh)
  // `Processing` claim relative to the lease window.
  updatedAt?: Date
}) => {
  return db
    .insertInto("AuditLogExportRequest")
    .values({
      siteId,
      userId,
      auditLogDateRange: AUDIT_LOG_DATE_RANGE,
      reportType,
      status,
      attempts,
      ...(updatedAt ? { updatedAt } : {}),
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
      "ResourcePermission",
      "User",
      "Site",
      "AuditLog",
    )
    vi.clearAllMocks()
    mockGetStudioAssetsBucketName.mockReturnValue("test-audit-bucket")
    mockGenerateSignedGetUrl.mockResolvedValue("https://signed.example/url")
    mockUploadAuditLogExport.mockResolvedValue(undefined)
    mockSendAuditLogExportReadyEmail.mockResolvedValue(undefined)
    mockSendAuditLogExportFailedEmail.mockResolvedValue(undefined)
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
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(1)
    expect(mockUploadAuditLogExport.mock.calls[0]![0].key).toBe(expectedKey)

    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(1)
    const emailArg = mockSendAuditLogExportReadyEmail.mock.calls[0]![0]
    expect(emailArg.link).toEqual({
      label: "access",
      url: "https://signed.example/url",
    })
    expect(emailArg.recipientEmail).toBe("admin@vendor.com.sg")
    expect(emailArg.month).toBe("March 2024")
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
    expect(updated.objectKey).toBe(expectedKey)
  })

  it("processes a fanned-out Both request (two rows): two uploads, two single-link emails, both Done", async () => {
    // Arrange: a "Both" user request is stored as two independent rows — one
    // Access, one Activity — each fulfilled as its own job with its own email.
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
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(2)
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(2)
    const labels = mockSendAuditLogExportReadyEmail.mock.calls
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
    // Arrange: a site with no member permissions → empty access report.
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin3@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    // Revoke the admin's own permission so the access report is empty for this
    // site (note: @open.gov.sg is excluded anyway, but vendor emails are not).
    await db
      .updateTable("ResourcePermission")
      .set({ deletedAt: new Date("2020-01-01") })
      .where("userId", "=", admin.id)
      .where("siteId", "=", site.id)
      .execute()

    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Access",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(1)
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(1)

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
  })

  it("retries on failure and only fails (with email) after the third attempt", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin4@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })
    mockUploadAuditLogExport.mockRejectedValue(new Error("s3 down"))

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
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

    // Act: second sweep → attempt 2, still re-queued.
    await processPendingAuditLogExports()
    updated = await getRequest(request.id)
    expect(updated.attempts).toBe(2)
    expect(updated.status).toBe("Pending")
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

    // Act: third sweep → attempt 3, Failed + failed email sent.
    await processPendingAuditLogExports()
    updated = await getRequest(request.id)
    expect(updated.attempts).toBe(3)
    expect(updated.status).toBe("Failed")
    expect(mockSendAuditLogExportFailedEmail).toHaveBeenCalledTimes(1)
    const failedArg = mockSendAuditLogExportFailedEmail.mock.calls[0]![0]
    expect(failedArg.recipientEmail).toBe("admin4@vendor.com.sg")
    // The failure email's month label derives from the daterange lower bound.
    expect(failedArg.month).toBe("March 2024")

    // The ready email must never have been sent.
    expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()
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
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(1)
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(1)
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

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
    expect(mockUploadAuditLogExport).not.toHaveBeenCalled()
    expect(mockSendAuditLogExportReadyEmail).not.toHaveBeenCalled()
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Processing")
    expect(updated.attempts).toBe(0)
    // `updatedAt` must not have moved (not re-claimed).
    expect(updated.updatedAt.getTime()).toBe(freshUpdatedAt.getTime())
  })
})
