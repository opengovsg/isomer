import type { PreviewLinkExpiryChoice } from "~/schemas/previewLink"
import type { PrismaClient } from "~prisma/generated/prisma/client"
import { TRPCError } from "@trpc/server"
import { randomBytes } from "node:crypto"
import { RateLimiterPrisma, RateLimiterRes } from "rate-limiter-flexible"

import { logPreviewLinkEvent } from "../audit/audit.service"
import { AuditLogEvent, db, RoleType, sql } from "../database"
import {
  bulkValidateUserPermissionsForResources,
  isActiveIsomerAdmin,
} from "../permissions/permissions.service"

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

// Sharer OR Site Admin OR Isomer Admin. Single function the future can flip
// behind a site-level toggle without touching call sites.
const isUserSiteAdmin = async (
  userId: string,
  siteId: number,
): Promise<boolean> => {
  if (await isActiveIsomerAdmin(userId)) return true

  const role = await db
    .selectFrom("ResourcePermission")
    .where("userId", "=", userId)
    .where("siteId", "=", siteId)
    .where("resourceId", "is", null)
    .where("deletedAt", "is", null)
    .where("role", "=", RoleType.Admin)
    .select("id")
    .executeTakeFirst()

  return Boolean(role)
}

interface RevokePreviewLinkProps {
  userId: string
  linkId: string
  ip?: string
}

export const revokePreviewLink = async ({
  userId,
  linkId,
  ip,
}: RevokePreviewLinkProps) => {
  const link = await db
    .selectFrom("PreviewLink")
    .where("id", "=", linkId)
    .selectAll()
    .executeTakeFirst()

  if (!link) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Preview link not found",
    })
  }

  if (link.createdBy !== userId) {
    const isAdmin = await isUserSiteAdmin(userId, link.siteId)
    if (!isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "You do not have sufficient permissions to perform this action",
      })
    }
  }

  // Idempotent: revoking an already-revoked or already-expired link is a
  // success and writes no second audit row.
  if (link.revokedAt !== null || link.expiresAt <= new Date()) {
    return link
  }

  return await db.transaction().execute(async (tx) => {
    const revoked = await tx
      .updateTable("PreviewLink")
      .where("id", "=", linkId)
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
// layer, never in the UI.
export const listSitePreviewLinks = async ({
  userId,
  siteId,
  status,
}: ListSitePreviewLinksProps) => {
  await bulkValidateUserPermissionsForResources({
    action: "read",
    siteId,
    userId,
  })

  const viewerIsAdmin = await isUserSiteAdmin(userId, siteId)

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
// link id in metadata.
export const listActivePagePreviewLinks = async ({
  userId,
  siteId,
  resourceId,
}: ListActivePagePreviewLinksProps) => {
  // Gate by site read access. The query below also scopes to createdBy = userId,
  // but we still want to refuse callers who aren't a member of the site so we
  // don't expose "this site exists" via timing/empty results.
  await bulkValidateUserPermissionsForResources({
    action: "read",
    siteId,
    userId,
  })

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
