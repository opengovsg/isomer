import type {
  AuditLogEvent,
  Blob,
  DB,
  Footer,
  Navbar,
  Resource,
  ResourcePermission,
  Site,
  Transaction,
  User,
  VerificationToken,
  Version,
} from "../database"

type WithoutMeta<T> = Omit<T, "createdAt" | "updatedAt">

// NOTE: Either a folder/collection that doesn't have a blob
// or a page w/ blob
type FullResource =
  | WithoutMeta<Resource>
  | {
      blob: WithoutMeta<Blob>
      resource: WithoutMeta<Resource>
    }

interface ResourceCreateDelta {
  before: null
  after: FullResource
}
interface ResourceDeleteDelta {
  before: FullResource
  after: null
}
interface ResourceUpdateDelta {
  before: FullResource
  after: FullResource
}

export interface ResourceEventLogProps {
  eventType: Extract<
    AuditLogEvent,
    "ResourceCreate" | "ResourceUpdate" | "ResourceDelete" | "ResourceMove"
  >
  delta: ResourceCreateDelta | ResourceDeleteDelta | ResourceUpdateDelta
  by: User
  ip?: string
  siteId: Site["id"]
  metadata?: Record<string, unknown>
}

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

interface DeletePermissionDelta {
  before: ResourcePermission
  after: null
}

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
}

export const logPermissionEvent: AuditLogger<PermissionEventLogProps> = async (
  tx,
  { eventType, by, delta, ip, metadata = {} },
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
