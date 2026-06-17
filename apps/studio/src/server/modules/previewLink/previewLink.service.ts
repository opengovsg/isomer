import type { Selectable } from "kysely"
import type { PreviewLinkExpiryChoice } from "~/schemas/previewLink"
import type { PrismaClient } from "~prisma/generated/prisma/client"
import { randomBytes } from "node:crypto"
import { RateLimiterPrisma, RateLimiterRes } from "rate-limiter-flexible"

import type { PreviewLink } from "../database"
import { logPreviewLinkEvent } from "../audit/audit.service"
import { AuditLogEvent, db, sql } from "../database"
import { isUserSiteAdmin } from "../permissions/permissions.service"

type PreviewLinkRow = Selectable<PreviewLink>

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

interface MintPreviewLinkProps {
  userId: string
  siteId: number
  resourceId: number
  expiryChoice: PreviewLinkExpiryChoice
  label?: string | null
  ip?: string
}

// Permission is enforced at the router boundary via canSharePreview() — this
// function assumes the caller has already gated access.
export const mintPreviewLink = async ({
  userId,
  siteId,
  resourceId,
  expiryChoice,
  label,
  ip,
}: MintPreviewLinkProps) => {
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

interface RevokePreviewLinkProps {
  userId: string
  link: PreviewLinkRow
  ip?: string
}

// Permission is enforced at the router boundary (sharer OR Site/Isomer Admin),
// which loads the link in the process — pass that loaded row in here.
export const revokePreviewLink = async ({
  userId,
  link,
  ip,
}: RevokePreviewLinkProps) => {
  // Idempotent: revoking an already-revoked or already-expired link is a
  // success and writes no second audit row.
  if (link.revokedAt !== null || link.expiresAt <= new Date()) {
    return link
  }

  return await db.transaction().execute(async (tx) => {
    const revoked = await tx
      .updateTable("PreviewLink")
      .where("id", "=", link.id)
      .set({ revokedAt: new Date(), revokedBy: userId })
      .returningAll()
      .executeTakeFirstOrThrow()

    await logPreviewLinkEvent(tx, {
      eventType: AuditLogEvent.PreviewLinkRevoke,
      userId,
      siteId: link.siteId,
      ip,
      delta: { before: link, after: revoked },
    })

    return revoked
  })
}

// Soft-block view limiter: 60 requests per minute per (IP, linkId). Over-limit,
// the route shows a friendly soft-block page and does NOT write a view audit
// row — the audit log is exactly what this limit exists to protect.
const VIEW_RATE_LIMIT_MAX = 60
const VIEW_RATE_LIMIT_WINDOW_SECONDS = 60

export const checkPreviewViewRateLimit = async (
  prisma: PrismaClient,
  ip: string,
  linkId: string,
): Promise<boolean> => {
  const limiter = new RateLimiterPrisma({
    storeClient: prisma,
    points: VIEW_RATE_LIMIT_MAX,
    duration: VIEW_RATE_LIMIT_WINDOW_SECONDS,
    keyPrefix: "preview-view",
  })

  try {
    await limiter.consume(`${ip}|${linkId}`)
    return true
  } catch (err) {
    if (err instanceof RateLimiterRes) return false
    throw err
  }
}

interface ListSitePreviewLinksProps {
  userId: string
  siteId: number
  status: "active" | "expired" | "revoked" | "all"
}

// Site-level overview. Editor sees own links; Site Admin or Isomer Admin sees
// all. The same component renders both — scope is enforced here at the data
// layer, never in the UI. Site-membership permission is enforced at the
// router boundary; this function assumes the caller has been gated.
export const listSitePreviewLinks = async ({
  userId,
  siteId,
  status,
}: ListSitePreviewLinksProps) => {
  const viewerIsAdmin = await isUserSiteAdmin({ userId, siteId })

  let query = db
    .selectFrom("PreviewLink")
    .leftJoin("Resource", "Resource.id", "PreviewLink.resourceId")
    .leftJoin("User", "User.id", "PreviewLink.createdBy")
    .where("PreviewLink.siteId", "=", siteId)
    .select([
      "PreviewLink.id as id",
      "PreviewLink.token as token",
      "PreviewLink.label as label",
      "PreviewLink.expiresAt as expiresAt",
      "PreviewLink.revokedAt as revokedAt",
      "PreviewLink.createdAt as createdAt",
      "PreviewLink.createdBy as createdBy",
      "PreviewLink.resourceId as resourceId",
      "Resource.title as pageTitle",
      "User.name as sharerName",
      "User.email as sharerEmail",
    ])
    .orderBy("PreviewLink.createdAt", "desc")

  if (!viewerIsAdmin) {
    query = query.where("PreviewLink.createdBy", "=", userId)
  }

  const now = new Date()
  if (status === "active") {
    query = query
      .where("PreviewLink.revokedAt", "is", null)
      .where("PreviewLink.expiresAt", ">", now)
  } else if (status === "expired") {
    query = query
      .where("PreviewLink.revokedAt", "is", null)
      .where("PreviewLink.expiresAt", "<=", now)
  } else if (status === "revoked") {
    query = query.where("PreviewLink.revokedAt", "is not", null)
  }

  const rows = await query.execute()

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const viewStats = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.PreviewLinkView)
        .where(sql<boolean>`metadata->>'linkId' = ${String(row.id)}`)
        .select((eb) => [
          eb.fn.count<number>("id").as("viewCount"),
          eb.fn.max("createdAt").as("lastViewedAt"),
        ])
        .executeTakeFirst()

      return {
        ...row,
        viewCount: Number(viewStats?.viewCount ?? 0),
        lastViewedAt: viewStats?.lastViewedAt ?? null,
      }
    }),
  )

  return { viewerIsAdmin, links: enriched }
}

interface ListActivePagePreviewLinksProps {
  userId: string
  siteId: number
  resourceId: number
}

// Returns the current sharer's own active links for a single page. View counts
// and last-viewed timestamps are derived from AuditLog rows tagged with the
// link id in metadata. Site-membership permission is enforced at the router
// boundary.
export const listActivePagePreviewLinks = async ({
  userId,
  siteId,
  resourceId,
}: ListActivePagePreviewLinksProps) => {
  const links = await db
    .selectFrom("PreviewLink")
    .where("siteId", "=", siteId)
    .where("resourceId", "=", String(resourceId))
    .where("createdBy", "=", userId)
    .where("revokedAt", "is", null)
    .where("expiresAt", ">", new Date())
    .selectAll()
    .orderBy("createdAt", "desc")
    .execute()

  if (links.length === 0) return []

  const counts = await Promise.all(
    links.map(async (link) => {
      const row = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.PreviewLinkView)
        .where(sql<boolean>`metadata->>'linkId' = ${String(link.id)}`)
        .select((eb) => [
          eb.fn.count<number>("id").as("viewCount"),
          eb.fn.max("createdAt").as("lastViewedAt"),
        ])
        .executeTakeFirst()
      return {
        link,
        viewCount: Number(row?.viewCount ?? 0),
        lastViewedAt: row?.lastViewedAt ?? null,
      }
    }),
  )

  return counts
}
