import { VerificationToken } from "~prisma/generated/generatedTypes"

import type {
  AuditLogEvent,
  Blob,
  DB,
  Resource,
  Transaction,
  User,
} from "../database"

interface ResourceEventLogProps {
  eventType: Extract<
    AuditLogEvent,
    "ResourceCreate" | "ResourceUpdate" | "ResourceDelete" | "ResourceMove"
  >
  delta: {
    // NOTE: Can be undefined because folders/collections don't have blobs
    before: Resource & (Blob | undefined)
    after: Resource & (Blob | undefined)
  }
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
