import type { NextApiRequest, NextApiResponse } from "next"
import { addMinutes, subDays } from "date-fns"
import { sealData } from "iron-session"
import { createMocks } from "node-mocks-http"
import { resetTables } from "tests/integration/helpers/db"
import { setupSite, setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as s3Lib from "~/lib/s3"

import handler from "~/pages/api/audit-log-exports/download"
import { sealAuditLogExportToken } from "~/server/modules/audit/auditLogExportToken"
import { db } from "~/server/modules/database/database"

const BUCKET = "test-audit-bucket"
const EXPIRED_PAGE_PATH = "/audit-log-exports/expired"

// A presigned S3 URL echoing the object key, so the happy-path assertion can
// prove the route signed the RIGHT object.
const signedUrlFor = (key: string) =>
  `https://${BUCKET}.s3.amazonaws.com/${key}?X-Amz-Signature=deadbeef`

type SeedDownloadRequestValues = {
  siteId: number
  userId: string
  auditLogDateRange: string
  reportType: "Access"
  status: "Pending" | "Processing" | "Done" | "Failed"
  attempts: number
  objectKey?: string | null
  completedAt?: Date | null
}

const seedRequest = async ({
  siteId,
  userId,
  status = "Done",
  objectKey,
  completedAt,
}: {
  siteId: number
  userId: string
  status?: "Pending" | "Processing" | "Done" | "Failed"
  objectKey?: string | null
  completedAt?: Date | null
}) => {
  const values = {
    siteId,
    userId,
    auditLogDateRange: "[2024-03-01,2024-04-01)",
    reportType: "Access",
    status,
    attempts: 0,
  } satisfies SeedDownloadRequestValues
  if (objectKey !== undefined) {
    values.objectKey = objectKey
  }
  if (completedAt !== undefined) {
    values.completedAt = completedAt
  }

  return db
    .insertInto("AuditLogExportRequest")
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()
}

type MockRedirectResponse = {
  statusCode: number
  _getRedirectUrl: () => string
}

const callRoute = async (
  query: Record<string, string | string[]>,
  method: "GET" | "POST" = "GET",
) => {
  const { req, res }: { req: NextApiRequest; res: NextApiResponse } =
    createMocks({ method, query })
  await handler(req, res)
  // SAFETY: node-mocks-http augments NextApiResponse with redirect helpers used below
  return res as MockRedirectResponse
}

describe("GET /api/audit-log-exports/download", () => {
  beforeEach(async () => {
    await resetTables(
      "AuditLogExportRequest",
      "ResourcePermission",
      "User",
      "Site",
    )
    vi.clearAllMocks()
    vi.spyOn(s3Lib, "generateSignedGetUrl").mockImplementation(
      async ({ Key }) => signedUrlFor(Key),
    )
    vi.spyOn(s3Lib, "getStudioAssetsBucketName").mockReturnValue(BUCKET)
  })

  it("302s to a fresh presigned URL for the row's objectKey (happy path)", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "admin@vendor.com.sg" })
    const objectKey = `audit-log-exports/${site.id}/1/access.csv`

    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Done",
      objectKey,
      completedAt: new Date(),
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    // The route signed the correct object and redirected to it.
    expect(s3Lib.generateSignedGetUrl).toHaveBeenCalledTimes(1)
    expect(s3Lib.generateSignedGetUrl).toHaveBeenCalledWith({
      Bucket: BUCKET,
      Key: objectKey,
    })
    expect(res._getRedirectUrl()).toContain(objectKey)
  })

  it("redirects to the expired page for a Pending (not Done) row", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "pending@vendor.com.sg" })
    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Pending",
      objectKey: null,
      completedAt: null,
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("redirects to the expired page once the Download Window has elapsed", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "elapsed@vendor.com.sg" })
    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Done",
      objectKey: `audit-log-exports/${site.id}/1/access.csv`,
      // Completed 4 days ago — the 3-day window is long gone.
      completedAt: subDays(new Date(), 4),
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("treats the window boundary (completedAt + exactly 3 days) as expired", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "boundary@vendor.com.sg" })
    // completedAt is exactly 3 days before now, so windowEnd === now. The
    // boundary is exclusive (must be strictly after now), so this is expired.
    const now = new Date()
    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Done",
      objectKey: `audit-log-exports/${site.id}/1/access.csv`,
      completedAt: subDays(now, 3),
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("still serves a row completed just under 3 days ago (inside the window)", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "inside@vendor.com.sg" })
    const objectKey = `audit-log-exports/${site.id}/1/access.csv`
    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Done",
      objectKey,
      // Just inside the 3-day window: completed a few minutes less than 3 days
      // ago, so windowEnd is still a few minutes in the future.
      completedAt: addMinutes(subDays(new Date(), 3), 5),
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toContain(objectKey)
  })

  it("collapses an S3 presign failure to the expired redirect instead of a 500", async () => {
    const { site } = await setupSite()
    const user = await setupUser({ email: "s3down@vendor.com.sg" })
    const objectKey = `audit-log-exports/${site.id}/1/access.csv`
    // Infrastructure failure at the last step — a prober must not be able to
    // distinguish this from an expired link, and the handler must not 500.
    vi.spyOn(s3Lib, "generateSignedGetUrl").mockRejectedValue(
      new Error("S3 unavailable"),
    )
    const request = await seedRequest({
      siteId: site.id,
      userId: user.id,
      status: "Done",
      objectKey,
      completedAt: new Date(),
    })
    const token = await sealAuditLogExportToken(request.id)

    const res = await callRoute({ token })

    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
  })

  it("redirects to the expired page for an invalid / unsealable token", async () => {
    const res = await callRoute({ token: "not-a-real-token" })
    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("redirects to the expired page for a valid token pointing at an unknown row", async () => {
    // A well-sealed token whose requestId does not exist in the DB is
    // indistinguishable from any other failure.
    const token = await sealAuditLogExportToken("999999999")
    const res = await callRoute({ token })
    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("redirects to the expired page for a session-shaped blob sealed with the same key", async () => {
    const { env } = await import("~/env.mjs")
    // Cross-purpose confusion: a session cookie sealed with the shared key
    // must never be redeemed as a download link.
    const sessionBlob = await sealData(
      { userId: "some-user" },
      { password: { "1": env.SESSION_SECRET } },
    )
    const res = await callRoute({ token: sessionBlob })
    expect(res.statusCode).toBe(302)
    expect(res._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
    expect(s3Lib.generateSignedGetUrl).not.toHaveBeenCalled()
  })

  it("rejects non-GET methods with 405", async () => {
    const res = await callRoute({ token: "x" }, "POST")
    expect(res.statusCode).toBe(405)
  })

  it("redirects to the expired page when token is missing or repeated", async () => {
    const missing = await callRoute({})
    expect(missing.statusCode).toBe(302)
    expect(missing._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)

    const repeated = await callRoute({ token: ["a", "b"] })
    expect(repeated.statusCode).toBe(302)
    expect(repeated._getRedirectUrl()).toBe(EXPIRED_PAGE_PATH)
  })
})