import type { NextApiRequest, NextApiResponse } from "next"
import { addDays, isAfter, parseISO } from "date-fns"
import { AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS } from "~/constants/misc"
import { generateSignedGetUrl, getStudioAssetsBucketName } from "~/lib/s3"
import { unsealAuditLogExportToken } from "~/server/modules/audit/auditLogExportToken"
import { db } from "~/server/modules/database"

// A completed export email links here with a sealed Download Token (ADR
// 0006). We unseal it, re-read the request row (the source of truth), and —
// only if the row is Done, has an objectKey, and is still inside its Download
// Window (completedAt + AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS) — mint a fresh,
// short-lived presigned S3 URL and 302 to it. Every failure mode collapses to
// one indistinguishable redirect to the "link expired" page, so a probing
// recipient learns nothing about whether a request exists or why it failed.

const EXPIRED_PAGE_PATH = "/audit-log-exports/expired"

const redirectToExpired = (res: NextApiResponse) => {
  res.redirect(302, EXPIRED_PAGE_PATH)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed")
  }

  // `token` may arrive as a repeated query param (string[]) — only a single
  // string is ever a valid token.
  const { token } = req.query
  if (typeof token !== "string") {
    return redirectToExpired(res)
  }

  const requestId = await unsealAuditLogExportToken(token)
  if (requestId === null) {
    return redirectToExpired(res)
  }

  const request = await db
    .selectFrom("AuditLogExportRequest")
    .where("id", "=", requestId)
    .select(["status", "objectKey", "completedAt"])
    .executeTakeFirst()

  // Unknown row, not yet Done, or missing artifact — nothing to hand out.
  if (
    !request ||
    request.status !== "Done" ||
    request.objectKey === null ||
    request.completedAt === null
  ) {
    return redirectToExpired(res)
  }

  // Window anchors to THIS request's completedAt, never the CSV object's age:
  // under Complete-Artifact reuse one CSV serves many requests, each with its
  // own window (ADR 0006). The boundary is exclusive — a click at exactly
  // completedAt + 3 days is expired.
  const completedAt =
    request.completedAt instanceof Date
      ? request.completedAt
      : parseISO(String(request.completedAt))
  const windowEnd = addDays(completedAt, AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS)
  if (!isAfter(windowEnd, new Date())) {
    return redirectToExpired(res)
  }

  // Mint a fresh presigned URL at CLICK time with the short default expiry in
  // ~/lib/s3 — this is what dodges the signing-credential lifetime cap that
  // killed the old emailed presigned URLs (ADR 0006).
  const url = await generateSignedGetUrl({
    Bucket: getStudioAssetsBucketName(),
    Key: request.objectKey,
  })

  return res.redirect(302, url)
}
