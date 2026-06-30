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
  links: { label: string; url: string }[]
}

interface FailedEmailArg {
  recipientEmail: string
  siteName: string
  month: string
}

const {
  mockUploadAuditLogExport,
  mockGenerateSignedGetUrl,
  mockGetAuditLogExportBucketName,
  mockSendAuditLogExportReadyEmail,
  mockSendAuditLogExportFailedEmail,
} = vi.hoisted(() => ({
  mockUploadAuditLogExport:
    vi.fn<(args: { key: string; body: unknown }) => Promise<void>>(),
  mockGenerateSignedGetUrl: vi.fn<() => Promise<string>>(),
  mockGetAuditLogExportBucketName: vi.fn<() => string>(),
  mockSendAuditLogExportReadyEmail:
    vi.fn<(data: ReadyEmailArg) => Promise<void>>(),
  mockSendAuditLogExportFailedEmail:
    vi.fn<(data: FailedEmailArg) => Promise<void>>(),
}))

// `~/lib/s3` (mocked below) is the only thing in this service's import chain
// that requires `S3_AUDIT_LOG_EXPORT_BUCKET_NAME`, and `~/lib/logger` only
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
    S3_AUDIT_LOG_EXPORT_BUCKET_NAME: "test-audit-bucket",
  },
}))

// Mock only the external boundaries (S3 + mail). The DB is NOT mocked — the
// request rows, sites, users and permissions are seeded into a real Postgres.
vi.mock("~/lib/s3", () => ({
  uploadAuditLogExport: mockUploadAuditLogExport,
  generateSignedGetUrl: mockGenerateSignedGetUrl,
  getAuditLogExportBucketName: mockGetAuditLogExportBucketName,
  AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS: 60 * 60 * 24 * 3,
}))

vi.mock("~/features/mail/service", () => ({
  sendAuditLogExportReadyEmail: mockSendAuditLogExportReadyEmail,
  sendAuditLogExportFailedEmail: mockSendAuditLogExportFailedEmail,
}))

import { db } from "../../database"
import { processPendingAuditLogExports } from "../auditLogExport.service"

const MONTH = "2024-03"

type ReportType = "Access" | "Activity" | "Both"

const seedRequest = async ({
  siteId,
  userId,
  reportType,
  status = "Pending",
  attempts = 0,
}: {
  siteId: number
  userId: string
  reportType: ReportType
  status?: "Pending" | "Processing" | "Done" | "Failed"
  attempts?: number
}) => {
  return db
    .insertInto("AuditLogExportRequest")
    .values({
      siteId,
      userId,
      month: MONTH,
      reportType,
      status,
      attempts,
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
    mockGetAuditLogExportBucketName.mockReturnValue("test-audit-bucket")
    mockGenerateSignedGetUrl.mockResolvedValue("https://signed.example/url")
    mockUploadAuditLogExport.mockResolvedValue(undefined)
    mockSendAuditLogExportReadyEmail.mockResolvedValue(undefined)
    mockSendAuditLogExportFailedEmail.mockResolvedValue(undefined)
  })

  it("processes an Access request: one upload, one link, status Done", async () => {
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

    // Assert
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(1)
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(1)
    const emailArg = mockSendAuditLogExportReadyEmail.mock.calls[0]![0]
    expect(emailArg.links).toHaveLength(1)
    expect(emailArg.recipientEmail).toBe("admin@vendor.com.sg")
    expect(mockSendAuditLogExportFailedEmail).not.toHaveBeenCalled()

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
    expect(updated.objectKeys).toHaveLength(1)
  })

  it("processes a Both request: two uploads, two links, status Done", async () => {
    // Arrange
    const { site } = await setupSite()
    const admin = await setupUser({ email: "admin2@vendor.com.sg" })
    await setupAdminPermissions({ userId: admin.id, siteId: site.id })

    const request = await seedRequest({
      siteId: site.id,
      userId: admin.id,
      reportType: "Both",
    })

    // Act
    await processPendingAuditLogExports()

    // Assert
    expect(mockUploadAuditLogExport).toHaveBeenCalledTimes(2)
    expect(mockSendAuditLogExportReadyEmail).toHaveBeenCalledTimes(1)
    const emailArg = mockSendAuditLogExportReadyEmail.mock.calls[0]![0]
    expect(emailArg.links).toHaveLength(2)

    const updated = await getRequest(request.id)
    expect(updated.status).toBe("Done")
    expect(updated.objectKeys).toHaveLength(2)
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
})
