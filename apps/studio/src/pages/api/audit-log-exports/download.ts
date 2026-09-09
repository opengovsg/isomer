import type { NextApiRequest, NextApiResponse } from "next"
import { addDays, isAfter } from "date-fns"
import { AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS } from "~/constants/misc"
import { createBaseLogger } from "~/lib/logger"
import { generateSignedGetUrl, getStudioAssetsBucketName } from "~/lib/s3"
import { unsealAuditLogExportToken } from "~/server/modules/audit/auditLogExportToken"
import { db } from "~/server/modules/database"

// A completed export email links here with a sealed Download Token (ADR
// 0006, extended by ADR 0009 for the batch case). We unseal it, re-read the
// source of truth (a single request row, or a shared batch row), and — only
// if it's ready and still inside its Download Window — mint a fresh,
// short-lived presigned S3 URL and 302 to it. Every failure mode collapses to
// one indistinguishable redirect to the "link expired" page, so a probing
// recipient learns nothing about whether a request/batch exists or why it
// failed.

const EXPIRED_PAGE_PATH = "/audit-log-exports/expired"

const logger = createBaseLogger({
  path: "api/audit-log-exports/download",
})

const redirectToExpired = (res: NextApiResponse) => {
  res.redirect(302, EXPIRED_PAGE_PATH)
}

// Resolves a single-request Download Token to its CSV's S3 key, or `null` if
// it's not ready to hand out. Window anchors to THIS request's completedAt,
// never the CSV object's age: under Complete-Artifact reuse one CSV serves
// many requests, each with its own window (ADR 0006). The boundary is
// exclusive — a click at exactly completedAt + 3 days is expired.
const resolveRequestObjectKey = async (
  requestId: string,
): Promise<string | null> => {
  const request = await db
    .selectFrom("AuditLogExportRequest")
    .where("id", "=", requestId)
    .select(["status", "objectKey", "completedAt"])
    .executeTakeFirst()

  if (
    !request ||
    request.status !== "Done" ||
    request.objectKey === null ||
    request.completedAt === null
  ) {
    return null
  }

  const windowEnd = addDays(
    request.completedAt,
    AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS,
  )
  return isAfter(windowEnd, new Date()) ? request.objectKey : null
}

// Resolves a batch Download Token to the shared zip's S3 key, or `null` if
// it's not ready to hand out. `emailedAt` is the batch equivalent of a single
// request's completedAt: it's the only per-batch instant available (the
// batch has no single completion time of its own — see ADR 0009), and it's
// only ever set once the zip has actually been built and the email sent, so
// its presence alone already implies the zip exists.
const resolveBatchObjectKey = async (
  batchId: string,
): Promise<string | null> => {
  const batch = await db
    .selectFrom("AuditLogExportBatch")
    .where("batchId", "=", batchId)
    .select(["zipObjectKey", "emailedAt"])
    .executeTakeFirst()

  if (!batch || batch.zipObjectKey === null || batch.emailedAt === null) {
    return null
  }

  const windowEnd = addDays(batch.emailedAt, AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS)
  return isAfter(windowEnd, new Date()) ? batch.zipObjectKey : null
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

  // Infrastructure failures (DB down, bucket env unset, S3 presign error)
  // must collapse to the same expired redirect as a bad token — a raw 500
  // would let a prober distinguish transient errors from expired links. The
  // log line is the operator's only signal, so it must never be skipped.
  try {
    const unsealed = await unsealAuditLogExportToken(token)
    if (unsealed === null) {
      return redirectToExpired(res)
    }

    const objectKey =
      unsealed.kind === "request"
        ? await resolveRequestObjectKey(unsealed.requestId)
        : await resolveBatchObjectKey(unsealed.batchId)

    if (objectKey === null) {
      return redirectToExpired(res)
    }

    // Mint a fresh presigned URL at CLICK time with the short default expiry
    // in ~/lib/s3 — this is what dodges the signing-credential lifetime cap
    // that killed the old emailed presigned URLs (ADR 0006).
    const url = await generateSignedGetUrl({
      Bucket: getStudioAssetsBucketName(),
      Key: objectKey,
    })

    return res.redirect(302, url)
  } catch (error) {
    // Never log the token itself — it is a live bearer credential.
    logger.error({ error }, "Failed to redeem audit log export download token")
    return redirectToExpired(res)
  }
}
