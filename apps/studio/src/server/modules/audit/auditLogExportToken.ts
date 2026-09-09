import { sealData, unsealData } from "iron-session"
import { AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS } from "~/constants/misc"

import { getIronPassword } from "../auth/session"

// The discriminators baked into every Download Token. Because these tokens
// are sealed with the SAME password map as session cookies (see
// getIronPassword), the purpose string plus strict payload-shape validation
// on unseal is what prevents a session blob from ever being mistaken for a
// Download Token (or vice versa) — the cross-purpose defence for the shared
// key. `-batch` points at a shared zip archive (ADR 0009) rather than one
// request's CSV. Do not change either value without invalidating outstanding
// links.
const AUDIT_LOG_EXPORT_TOKEN_PURPOSE = "audit-log-export"
const AUDIT_LOG_EXPORT_BATCH_TOKEN_PURPOSE = "audit-log-export-batch"

// iron-session's `ttl` is in SECONDS. The token's iron-level expiry mirrors
// the Download Window (AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS) so a token can never
// outlive the window even in isolation. The row's/batch's window-anchor field
// is still the authoritative check on redemption (see the download route);
// this ttl is only a cheap first line of defence.
const AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS =
  60 * 60 * 24 * AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS

// The sealed payload carries ONLY an id and its purpose — never the S3 key,
// status, or window. The row (or batch) is the source of truth; the token is
// a pointer (see ADR 0006, extended by ADR 0009 for the batch case).
// `AuditLogExportRequest.id` is a Prisma BigInt, surfaced by Kysely as a
// string — carried as such so callers can feed it straight back into a
// `where("id", "=", ...)` without re-parsing.

export type UnsealedAuditLogExportToken =
  | { kind: "request"; requestId: string }
  | { kind: "batch"; batchId: string }

/**
 * Seal a Download Token for one audit-log-export request. The returned string
 * is an AEAD (AES-256-CBC + HMAC-SHA256) blob safe to embed in an emailed URL:
 * it reveals nothing about the request and cannot be forged or tampered with
 * without the session secret.
 */
export const sealAuditLogExportToken = async (
  requestId: string,
): Promise<string> => {
  return sealData(
    { purpose: AUDIT_LOG_EXPORT_TOKEN_PURPOSE, requestId },
    {
      password: getIronPassword(),
      ttl: AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS,
    },
  )
}

/**
 * Seal a Download Token for one batch's zip archive (ADR 0009) — the batch
 * equivalent of `sealAuditLogExportToken`.
 */
export const sealAuditLogExportBatchToken = async (
  batchId: string,
): Promise<string> => {
  return sealData(
    { purpose: AUDIT_LOG_EXPORT_BATCH_TOKEN_PURPOSE, batchId },
    {
      password: getIronPassword(),
      ttl: AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS,
    },
  )
}

/**
 * Unseal a Download Token, returning which kind it points at (a single
 * request's CSV, or a batch's shared zip) and its id, or `null` if the token
 * is unusable for ANY reason: a forged/tampered seal, an iron-level ttl
 * expiry, an unrecognised purpose, or an id that fails its shape check.
 * Returning a single `null` for every failure keeps the redemption route's
 * responses indistinguishable (ADR 0006) and prevents a session cookie
 * sealed with the same key from ever being accepted as a Download Token.
 */
// A raw, loosely-typed view of whatever unsealed — deliberately NOT
// `Partial<AuditLogExportTokenPayload & AuditLogExportBatchTokenPayload>`:
// intersecting two interfaces whose `purpose` fields are different string
// literals collapses that field to `never`, which is exactly the shape we
// need to narrow away from below.
interface RawTokenPayload {
  purpose?: string
  requestId?: string
  batchId?: string
}

export const unsealAuditLogExportToken = async (
  token: string,
): Promise<UnsealedAuditLogExportToken | null> => {
  let payload: RawTokenPayload
  try {
    // A bad seal or an expired ttl makes iron-session throw (or, for an
    // expired seal, return an empty object) — both collapse to `null` below.
    payload = await unsealData<RawTokenPayload>(token, {
      password: getIronPassword(),
      ttl: AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS,
    })
  } catch {
    return null
  }

  // Strict payload-shape validation per purpose: this is the cross-purpose
  // defence — a session blob unseals fine with the shared key but fails
  // every shape check below. BigInt ids never carry signs, leading zeros, or
  // non-digits, hence the plain positive-integer check.
  if (payload.purpose === AUDIT_LOG_EXPORT_TOKEN_PURPOSE) {
    if (
      typeof payload.requestId !== "string" ||
      !/^[1-9]\d*$/.test(payload.requestId)
    ) {
      return null
    }
    return { kind: "request", requestId: payload.requestId }
  }

  if (payload.purpose === AUDIT_LOG_EXPORT_BATCH_TOKEN_PURPOSE) {
    if (typeof payload.batchId !== "string" || payload.batchId.length === 0) {
      return null
    }
    return { kind: "batch", batchId: payload.batchId }
  }

  return null
}
