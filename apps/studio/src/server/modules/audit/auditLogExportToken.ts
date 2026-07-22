import { sealData, unsealData } from "iron-session"
import { AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS } from "~/constants/misc"

import { getIronPassword } from "../auth/session"

// The discriminator baked into every Download Token. Because these tokens are
// sealed with the SAME password map as session cookies (see
// getIronPassword), the purpose string plus strict payload-shape validation
// on unseal is what prevents a session blob from ever being mistaken for a
// Download Token (or vice versa) — the cross-purpose defence for the shared
// key. Do not change this value without invalidating outstanding links.
const AUDIT_LOG_EXPORT_TOKEN_PURPOSE = "audit-log-export"

// iron-session's `ttl` is in SECONDS. The token's iron-level expiry mirrors
// the Download Window (AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS) so a token can never
// outlive the window even in isolation. The row's `completedAt`-anchored
// window is still the authoritative check on redemption (see the download
// route); this ttl is only a cheap first line of defence.
const AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS =
  60 * 60 * 24 * AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS

// The sealed payload carries ONLY the request id and its purpose — never the
// S3 key, status, or window. The row is the source of truth; the token is a
// pointer (see ADR 0006).
interface AuditLogExportTokenPayload {
  purpose: typeof AUDIT_LOG_EXPORT_TOKEN_PURPOSE
  // `AuditLogExportRequest.id` is a Prisma BigInt, surfaced by Kysely as a
  // string — carry it as such so callers can feed it straight back into a
  // `where("id", "=", ...)` without re-parsing.
  requestId: string
}

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
 * Unseal a Download Token, returning its request id, or `null` if the token is
 * unusable for ANY reason: a forged/tampered seal, an iron-level ttl expiry, a
 * wrong or missing purpose, or a request id that is not a plain positive
 * integer string. Returning a single `null` for every failure keeps the
 * redemption route's responses indistinguishable (ADR 0006) and prevents a
 * session cookie sealed with the same key from ever being accepted as a
 * Download Token.
 */
export const unsealAuditLogExportToken = async (
  token: string,
): Promise<string | null> => {
  let payload: Partial<AuditLogExportTokenPayload>
  try {
    // A bad seal or an expired ttl makes iron-session throw (or, for an
    // expired seal, return an empty object) — both collapse to `null` below.
    payload = await unsealData<Partial<AuditLogExportTokenPayload>>(token, {
      password: getIronPassword(),
      ttl: AUDIT_LOG_EXPORT_TOKEN_TTL_SECONDS,
    })
  } catch {
    return null
  }

  // Strict payload-shape validation: the purpose must match exactly and the
  // request id must be a plain positive-integer string (BigInt ids never carry
  // signs, leading zeros, or non-digits). This is the cross-purpose defence —
  // a session blob unseals fine with the shared key but fails this shape check.
  if (payload.purpose !== AUDIT_LOG_EXPORT_TOKEN_PURPOSE) {
    return null
  }
  if (
    typeof payload.requestId !== "string" ||
    !/^\d+$/.test(payload.requestId)
  ) {
    return null
  }

  return payload.requestId
}
