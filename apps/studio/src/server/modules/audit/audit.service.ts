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
  metadata: {
    sessionId?: string
  }
}

export const logResourceEvent = async (
  tx: Transaction<DB>,
  { eventType, delta, by, metadata, ip }: ResourceEventLogProps,
) => {
  await tx
    .insertInto("AuditLog")
    .values({ eventType, delta, userId: by.id, ipAddress: ip, metadata })
    .execute()
}

export const logAuthEvent = async () => {}
