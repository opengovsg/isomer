import {
  ResourcePermission,
  VerificationToken,
} from "~prisma/generated/generatedTypes"

import type {
  AuditLogEvent,
  Blob,
  DB,
  Resource,
  Transaction,
  User,
} from "../database"

type FullResource = Resource & (Blob | undefined)

interface CreateDelta {
  before: null
  after: FullResource
}
interface DeleteDelta {
  before: FullResource
  after: null
}
interface UpdateDelta {
  before: FullResource
  after: FullResource
}

interface ResourceEventLogProps {
  eventType: Extract<
    AuditLogEvent,
    "ResourceCreate" | "ResourceUpdate" | "ResourceDelete" | "ResourceMove"
  >
  delta: CreateDelta | DeleteDelta | UpdateDelta
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

interface LoginDelta {
  before: VerificationToken
  after: VerificationToken
}

// NOTE: logout just calls `session.destroy` and we only have
// `userId` or sgid info in session.
interface LogoutDelta {
  before: User
  after: {}
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
    .values({ eventType, delta, userId: by.id, ipAddress: ip })
    .execute()
}

interface PublishEventLogProps {
  by: User
  delta: {
    // NOTE: `null` if this is the first publish
    // We don't want to store the `version` because it is a pointer
    // to the blob/resource
    // we will instead store the full data here so it is an accurate snapshot
    before: (FullResource & { versionNumber: number }) | null
    after: FullResource & { versionNumber: number }
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
