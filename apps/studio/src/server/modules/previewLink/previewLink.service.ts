import { randomBytes } from "node:crypto"

import type { PreviewLinkExpiryChoice } from "~/schemas/previewLink"
import { logPreviewLinkEvent } from "../audit/audit.service"
import { AuditLogEvent, db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

const EXPIRY_MS: Record<PreviewLinkExpiryChoice, number> = {
  "24h": 24 * MS_PER_HOUR,
  "3d": 3 * MS_PER_DAY,
  "7d": 7 * MS_PER_DAY,
}

const TOKEN_BYTES = 32 // 256-bit; base64url-encoded → 43 chars

const generateToken = (): string =>
  randomBytes(TOKEN_BYTES).toString("base64url")

interface CanSharePreviewProps {
  userId: string
  siteId: number
  resourceId: number
}

// Single permission gate for minting preview links. Today this is "user can
// update the resource"; a future site-level toggle (Q6 of the design) flips
// here without touching call sites.
export const canSharePreview = async ({
  userId,
  siteId,
}: CanSharePreviewProps) => {
  await bulkValidateUserPermissionsForResources({
    action: "update",
    siteId,
    userId,
  })
}

interface MintPreviewLinkProps {
  userId: string
  siteId: number
  resourceId: number
  expiryChoice: PreviewLinkExpiryChoice
  label?: string | null
  ip?: string
}

export const mintPreviewLink = async ({
  userId,
  siteId,
  resourceId,
  expiryChoice,
  label,
  ip,
}: MintPreviewLinkProps) => {
  await canSharePreview({ userId, siteId, resourceId })

  const expiresAt = new Date(Date.now() + EXPIRY_MS[expiryChoice])

  return await db.transaction().execute(async (tx) => {
    const link = await tx
      .insertInto("PreviewLink")
      .values({
        token: generateToken(),
        siteId,
        resourceId: String(resourceId),
        createdBy: userId,
        label: label ?? null,
        expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await logPreviewLinkEvent(tx, {
      eventType: AuditLogEvent.PreviewLinkMint,
      userId,
      siteId,
      ip,
      delta: { before: null, after: link },
    })

    return link
  })
}
