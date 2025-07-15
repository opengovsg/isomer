import cuid2 from "@paralleldrive/cuid2"
import { TRPCError } from "@trpc/server"

import type { DB, Transaction, User } from "../../database"
import {
  sendPublishAlertContentPublisherEmail,
  sendPublishAlertSiteAdminEmail,
} from "~/features/mail/service"
import { logUserEvent } from "../../audit/audit.service"
import { AuditLogEvent, db, RoleType } from "../../database"

interface UpsertUserParams {
  tx: Transaction<DB>
  email: string
}

export const upsertUser = async ({
  tx,
  email,
}: UpsertUserParams): Promise<User> => {
  const emailName = email.split("@")[0] ?? "unknown"

  const possibleUser = await tx
    .selectFrom("User")
    .selectAll()
    .where("email", "=", email)
    .where("deletedAt", "is", null)
    .executeTakeFirst()

  if (possibleUser) {
    // NOTE: We are not logging the UserUpdate event here, as that is already
    // captured under the UserLogin event
    return possibleUser
  }

  const newUser = await tx
    .insertInto("User")
    .values({
      id: cuid2.createId(),
      email,
      phone: "", // NOTE: The phone number is added in a later step by the user
      name: emailName,
      lastLoginAt: null,
    })
    .returningAll()
    .executeTakeFirst()

  if (!newUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create user",
    })
  }

  await logUserEvent(tx, {
    by: newUser,
    delta: {
      before: null,
      after: newUser,
    },
    eventType: AuditLogEvent.UserCreate,
  })

  return newUser
}

interface AlertPublishWhenSingpassDisabledParams {
  siteId: number
  resourceId: string
  publisherId: User["id"]
  publisherEmail: User["email"]
}

export const alertPublishWhenSingpassDisabled = async ({
  siteId,
  resourceId,
  publisherId,
  publisherEmail,
}: AlertPublishWhenSingpassDisabledParams) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.name")
    .executeTakeFirstOrThrow()

  const resource = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const allSiteAdminsMinusCurrentUser = await db
    .selectFrom("User")
    .innerJoin("ResourcePermission", "ResourcePermission.userId", "User.id")
    .where("User.deletedAt", "is", null)
    .where("ResourcePermission.siteId", "=", siteId)
    .where("ResourcePermission.role", "=", RoleType.Admin)
    .where("ResourcePermission.userId", "!=", publisherId)
    .where("ResourcePermission.deletedAt", "is", null)
    .select("User.email")
    .execute()

  await Promise.all([
    sendPublishAlertContentPublisherEmail({
      recipientEmail: publisherEmail,
      siteName: site.name,
      resource,
    }),
    ...allSiteAdminsMinusCurrentUser.map((admin) =>
      sendPublishAlertSiteAdminEmail({
        recipientEmail: admin.email,
        publisherEmail,
        siteName: site.name,
        resource,
      }),
    ),
  ])
}
