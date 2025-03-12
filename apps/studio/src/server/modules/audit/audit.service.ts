import { VerificationToken } from "~prisma/generated/generatedTypes"

import type {
  AuditLogEvent,
  Blob,
  DB,
  Resource,
  Transaction,
  User,
  Version,
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
