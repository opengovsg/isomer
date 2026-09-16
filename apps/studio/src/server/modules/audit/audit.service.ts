import type { IsomerSchema } from "@opengovsg/isomer-components"

import type {
  AuditLogExportReportType,
  Blob,
  DB,
  Footer,
  Navbar,
  PushDocumentJob,
  Redirect,
  Resource,
  ResourcePermission,
  Site,
  Transaction,
  User,
  VerificationToken,
  Version,
} from "../database"
import { AuditLogEvent, db, sql } from "../database"

type WithoutMeta<T> = Omit<T, "createdAt" | "updatedAt">

// NOTE: Either a folder/collection that doesn't have a blob
// or a page w/ blob
export type FullResource =
  | WithoutMeta<Resource>
  | {
      blob: WithoutMeta<Blob>
      resource: WithoutMeta<Resource>
    }

// map each event type to its delta type
interface ResourceEventDeltaMap {
  ResourceCreate: {
    before: null
    after: FullResource
  }
  ResourceUpdate: {
    before: FullResource
    after: FullResource
  }
  ResourceDelete: {
    before: FullResource
    after: null
  }
  SchedulePublish: {
    before: FullResource
    after: FullResource
  }
  CancelSchedulePublish:
    | {
        before: FullResource
        after: FullResource
      }
    // egazette cancel: the resource is deleted in the same transaction, so we
    // log the deleted PushDocumentJob row instead of a synthetic resource
    // snapshot that never lands in the DB.
    | {
        before: WithoutMeta<PushDocumentJob>
        after: null
      }
}

interface BaseResourceEventLogProps {
  by: User
  ip?: string
  siteId: Site["id"]
  metadata?: Record<string, unknown>
}

export type ResourceEventLogProps = {
  [K in keyof ResourceEventDeltaMap]: BaseResourceEventLogProps & {
    eventType: K
    delta: ResourceEventDeltaMap[K]
  }
}[keyof ResourceEventDeltaMap]

// NOTE: Type to force every logger method to have a tx
export type AuditLogger<T> = (tx: Transaction<DB>, props: T) => Promise<void>

export const logResourceEvent: AuditLogger<ResourceEventLogProps> = async (
  tx,
  { eventType, delta, by, ip, siteId, metadata = {} },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata,
      siteId,
    })
    .execute()
}

interface SiteConfigUpdateDelta {
  before: Site
  after: Site
}

interface FooterUpdateDelta {
  before: Footer
  after: Footer
}

interface NavbarUpdateDelta {
  before: Navbar
  after: Navbar
}

type ConfigEventLogProps =
  | FooterUpdateEventLogProps
  | SiteConfigUpdateEventLogProps
  | NavbarUpdateEventLogProps

interface FooterUpdateEventLogProps {
  eventType: Extract<AuditLogEvent, "FooterUpdate">
  delta: FooterUpdateDelta
  by: User
  ip?: string
  siteId: Site["id"]
}

interface NavbarUpdateEventLogProps {
  eventType: Extract<AuditLogEvent, "NavbarUpdate">
  delta: NavbarUpdateDelta
  by: User
  ip?: string
  siteId: Site["id"]
}

interface SiteConfigUpdateEventLogProps {
  eventType: Extract<AuditLogEvent, "SiteConfigUpdate">
  delta: SiteConfigUpdateDelta
  by: User
  ip?: string
  siteId: Site["id"]
}

export const logConfigEvent: AuditLogger<ConfigEventLogProps> = async (
  tx,
  { eventType, delta, by, ip, siteId },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      siteId,
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata: {},
    })
    .execute()
}

// map each event type to its delta type
interface RedirectEventDeltaMap {
  RedirectCreate: {
    // Creating a redirect for a soft-deleted source revives it, so `before`
    // is the soft-deleted row in that case and null otherwise
    before: Redirect | null
    after: Redirect
  }
  RedirectDelete: {
    // Redirects are soft-deleted, so `after` is the real row with
    // `deletedAt` set rather than null
    before: Redirect
    after: Redirect
  }
}

export type RedirectEventLogProps = {
  [K in keyof RedirectEventDeltaMap]: {
    eventType: K
    delta: RedirectEventDeltaMap[K]
    by: User
    ip?: string
    siteId: Site["id"]
  }
}[keyof RedirectEventDeltaMap]

export const logRedirectEvent: AuditLogger<RedirectEventLogProps> = async (
  tx,
  { eventType, delta, by, ip, siteId },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      siteId,
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata: {},
    })
    .execute()
}

interface LoginDelta {
  before: VerificationToken
  after: null
}

// NOTE: logout just calls `session.destroy` and we only have
// `userId` info in session.
interface LogoutDelta {
  before: User
  after: null
}

interface AuthEventLogProps {
  eventType: Extract<AuditLogEvent, "Login" | "Logout">
  delta: LoginDelta | LogoutDelta
  by: User
  ip?: string
}
export const logAuthEvent: AuditLogger<AuthEventLogProps> = async (
  tx,
  { eventType, delta, by, ip },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata: {},
    })
    .execute()
}

interface VersionPointer {
  versionId: Version["id"]
}

type BlobPublishEvent = Resource & Blob
// NOTE: Only 2 kinds of config changes atm
// first, we allow users to set site notif
// next, admins can wholesale update site + footer + navbar
type ConfigPublishEvent = { site: Site } & { navbar?: Navbar } & {
  footer?: Footer
}

interface PublishEventLogProps<
  Before,
  After,
  Meta extends Record<string, unknown> | null,
> {
  by: User
  delta: {
    before: Before extends null ? null : WithoutMeta<Before>
    after: After extends null ? null : WithoutMeta<After>
  }
  eventType: Extract<AuditLogEvent, "Publish">
  ip?: string
  metadata: Meta
  siteId: Site["id"]
}

// NOTE: First publish of a blob will have no `versionId`
// but every subsequent publish will have
type BlobPublishEventLogProps = PublishEventLogProps<
  null | VersionPointer,
  VersionPointer,
  BlobPublishEvent
>

type ResourcePublishEventLogProps = PublishEventLogProps<null, null, Resource>

// NOTE: users cannot delete config - so this will forever be an update
type ConfigPublishEventLogProps = PublishEventLogProps<
  null,
  null,
  ConfigPublishEvent
>

type RepublishEventLogProps = PublishEventLogProps<
  null,
  null,
  Record<string, unknown>
>

export const logPublishEvent: AuditLogger<
  | BlobPublishEventLogProps
  | ResourcePublishEventLogProps
  | ConfigPublishEventLogProps
  | RepublishEventLogProps
> = async (tx, { by, delta, eventType, ip, siteId, metadata = {} }) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata,
      siteId,
    })
    .execute()
}

interface CreateUserDelta {
  before: null
  after: User
}

interface DeleteUserDelta {
  before: User
  after: null
}

interface UpdateUserDelta {
  before: User
  after: User
}

interface UserEventLogProps {
  by: User
  delta: CreateUserDelta | DeleteUserDelta | UpdateUserDelta
  eventType: Extract<AuditLogEvent, "UserCreate" | "UserUpdate" | "UserDelete">
  metadata?: Record<string, unknown>
  ip?: string
}

export const logUserEvent: AuditLogger<UserEventLogProps> = async (
  tx,
  { by, delta, eventType, ip, metadata = {} },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      metadata,
    })
    .execute()
}

interface CreatePermissionDelta {
  before: null
  after: ResourcePermission
}

// There's ResourcePermission for "before" and "after"
// as we are only soft-deleting the record
interface DeletePermissionDelta {
  before: ResourcePermission
  after: ResourcePermission
}

// Note: This is not used anywhere at the moment as we only soft-delete
// the ResourcePermission record, nevertheless, we keep it here for future use (if any)
interface UpdatePermissionDelta {
  before: ResourcePermission
  after: ResourcePermission
}

interface PermissionEventLogProps {
  eventType: Extract<
    AuditLogEvent,
    "PermissionUpdate" | "PermissionDelete" | "PermissionCreate"
  >
  by: User
  delta: CreatePermissionDelta | DeletePermissionDelta | UpdatePermissionDelta
  metadata?: Record<string, unknown>
  ip?: string
  siteId: Site["id"]
}

export const logPermissionEvent: AuditLogger<PermissionEventLogProps> = async (
  tx,
  { eventType, by, delta, ip, siteId, metadata = {} },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
      siteId,
      metadata,
    })
    .execute()
}

interface AuditLogExportCreateDelta {
  before: null
  after: {
    auditLogDateRange: string
    reportType: AuditLogExportReportType
  }
}

interface AuditLogExportEventLogProps {
  eventType: Extract<AuditLogEvent, "AuditLogExportCreate">
  delta: AuditLogExportCreateDelta
  by: User
  ip?: string
  siteId: Site["id"]
}

// Batched: an "allSites" ask (see auditLogExport.service.ts) can cover every
// site the caller Admins, and each site's request gets its own event —
// inserting all of them in one multi-row statement avoids holding that ask's
// transaction open for one extra round trip per site.
export const logAuditLogExportEvents: AuditLogger<
  AuditLogExportEventLogProps[]
> = async (tx, events) => {
  if (events.length === 0) {
    return
  }

  await tx
    .insertInto("AuditLog")
    .values(
      events.map(({ eventType, delta, by, ip, siteId }) => ({
        siteId,
        eventType,
        delta,
        userId: by.id,
        ipAddress: ip,
        metadata: {},
      })),
    )
    .execute()
}

export interface ResourceUpdateRow {
  id: string
  createdAt: Date
  actor: { id: string; name: string; email: string }
  beforeContent: IsomerSchema
  afterContent: IsomerSchema
}

interface ListResourceUpdatesProps {
  resourceId: number
  siteId: number
  cursor: number
  limit: number
}

interface ListResourceUpdatesResult {
  items: ResourceUpdateRow[]
  nextOffset: number | null
}

// Every `updatePageBlob` save logs a `ResourceUpdate` row even when the blob
// content didn't actually change (e.g. re-saving with no edits) — see
// `page.router.ts`. We filter those out here so the history panel only ever
// shows rows with a real content diff to render.
export const listResourceUpdates = async ({
  resourceId,
  siteId,
  cursor: offset,
  limit,
}: ListResourceUpdatesProps): Promise<ListResourceUpdatesResult> => {
  const resourceIdString = String(resourceId)

  const rows = await db
    .selectFrom("AuditLog")
    .innerJoin("User", "User.id", "AuditLog.userId")
    .select([
      "AuditLog.id as id",
      "AuditLog.createdAt",
      "AuditLog.delta",
      "User.id as actorId",
      "User.name as actorName",
      "User.email as actorEmail",
    ])
    .where("AuditLog.siteId", "=", siteId)
    .where("AuditLog.eventType", "=", AuditLogEvent.ResourceUpdate)
    .where(
      sql<boolean>`"AuditLog"."delta" -> 'after' -> 'resource' ->> 'id' = ${resourceIdString}`,
    )
    .where(sql<boolean>`"AuditLog"."delta" -> 'before' ? 'blob'`)
    .where(sql<boolean>`"AuditLog"."delta" -> 'after' ? 'blob'`)
    .where(
      sql<boolean>`"AuditLog"."delta" -> 'before' -> 'blob' -> 'content' IS DISTINCT FROM "AuditLog"."delta" -> 'after' -> 'blob' -> 'content'`,
    )
    .orderBy("AuditLog.createdAt", "desc")
    .offset(offset)
    .limit(limit + 1)
    .execute()

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const items = page.map((row): ResourceUpdateRow => {
    const delta = row.delta as unknown as {
      before: { blob: { content: IsomerSchema } }
      after: { blob: { content: IsomerSchema } }
    }
    return {
      id: row.id,
      createdAt: row.createdAt,
      actor: { id: row.actorId, name: row.actorName, email: row.actorEmail },
      beforeContent: delta.before.blob.content,
      afterContent: delta.after.blob.content,
    }
  })

  return {
    items,
    nextOffset: hasMore ? offset + limit : null,
  }
}
