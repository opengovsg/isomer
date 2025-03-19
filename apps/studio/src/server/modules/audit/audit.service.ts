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
} from "../database"

type FullResource = Resource & (Blob | undefined)

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

interface ResourceEventLogProps {
  eventType: Extract<
    AuditLogEvent,
    "ResourceCreate" | "ResourceUpdate" | "ResourceDelete" | "ResourceMove"
  >
  delta: ResourceCreateDelta | ResourceDeleteDelta | ResourceUpdateDelta
  by: User
  ip?: string
}

// NOTE: Type to force every logger method to have a tx
type AuditLogger<T> = (tx: Transaction<DB>, props: T) => Promise<void>

export const logResourceEvent: AuditLogger<ResourceEventLogProps> = async (
  tx,
  { eventType, delta, by, ip },
) => {
  await tx
    .insertInto("AuditLog")
    .values({ eventType, delta, userId: by.id, ipAddress: ip })
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
}

interface NavbarUpdateEventLogProps {
  eventType: Extract<AuditLogEvent, "NavbarUpdate">
  delta: NavbarUpdateDelta
  by: User
  ip?: string
}

interface SiteConfigUpdateEventLogProps {
  eventType: Extract<AuditLogEvent, "SiteConfigUpdate">
  delta: SiteConfigUpdateDelta
  by: User
  ip?: string
}

export const logConfigEvent: AuditLogger<ConfigEventLogProps> = async (
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

interface LoginDelta {
  before: { token: VerificationToken }
  after: { token: VerificationToken; user: User }
}

// NOTE: logout just calls `session.destroy` and we only have
// `userId` or sgid info in session.
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
    .values({ eventType, delta, userId: by.id, ipAddress: ip, metadata: {} })
    .execute()
}

type PublishEvents =
  | (FullResource & { versionNumber: number })
  | Site
  | Navbar
  | Footer

interface PublishEventLogProps {
  by: User
  delta: {
    // NOTE: `null` if this is the first publish
    // We don't want to store the `version` because it is a pointer
    // to the blob/resource
    // we will instead store the full data here so it is an accurate snapshot
    before: PublishEvents | null
    after: PublishEvents
  }
  eventType: Extract<AuditLogEvent, "Publish">
  ip?: string
}
export const logPublishEvent: AuditLogger<PublishEventLogProps> = async (
  tx,
  { by, delta, eventType, ip },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
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
  ip?: string
}

export const logUserEvent: AuditLogger<UserEventLogProps> = async (
  tx,
  { by, delta, eventType, ip },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
    })
    .execute()
}

interface CreatePermissionDelta {
  before: null
  after: ResourcePermission
}

interface DeletePermissionDelta {
  before: null
  after: ResourcePermission
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
  ip?: string
}

export const logPermissionEvent: AuditLogger<PermissionEventLogProps> = async (
  tx,
  { eventType, by, delta, ip },
) => {
  await tx
    .insertInto("AuditLog")
    .values({
      eventType,
      delta,
      userId: by.id,
      ipAddress: ip,
    })
    .execute()
}
