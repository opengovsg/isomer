import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"

import type { DB, Transaction, User } from "../database"
import type { AccountDeactivationEmailTemplateData } from "~/features/mail/templates/types"
import { sendAccountDeactivationEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db } from "../database"
import { PG_ERROR_CODES } from "../database/constants"

export const DAYS_IN_MS = 24 * 60 * 60 * 1000
export const DAYS_FROM_LAST_LOGIN = 90 // hardcoded to 90 as per IM8 requirement

const logger = createBaseLogger({
  path: "server/modules/user/inactiveUsers.service",
})

interface GetInactiveUsersProps {
  tx: Transaction<DB>
  daysFromLastLogin: number
}
export const getInactiveUsers = async ({
  tx,
  daysFromLastLogin,
}: GetInactiveUsersProps): Promise<User[]> => {
  const dateThreshold = new Date(Date.now() - daysFromLastLogin * DAYS_IN_MS)

  return tx
    .selectFrom("User")
    .innerJoin("ResourcePermission", "ResourcePermission.userId", "User.id")
    .where("User.deletedAt", "is", null)
    .where("ResourcePermission.deletedAt", "is", null)
    .where("User.email", "not in", ISOMER_ADMINS_AND_MIGRATORS_EMAILS) // needed to provide support for agencies
    .where((eb) =>
      eb.or([
        // Users who have never logged in
        eb.and([
          eb("User.lastLoginAt", "is", null),
          eb("User.createdAt", "<", dateThreshold),
        ]),
        // Users who have logged in but haven't logged in for a while
        eb.and([
          eb("User.lastLoginAt", "is not", null),
          eb("User.lastLoginAt", "<", dateThreshold),
        ]),
      ]),
    )
    .selectAll(["User"])
    .distinct()
    .execute()
}

interface DeactivateUserProps {
  user: User
  userIdsToDeactivate: User["id"][] // used for idempotency purposes
}
export const deactivateUser = async ({
  user,
  userIdsToDeactivate,
}: DeactivateUserProps): Promise<void> => {
  // Note: we are just deleting their site permissions (by setting deletedAt)
  // we are NOT deleting the user themselves because the intention is to
  // remove their access to interact with their sites, not remove them from Isomer
  let sitesAndAdmins: AccountDeactivationEmailTemplateData["sitesAndAdmins"] =
    []

  try {
    sitesAndAdmins = await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (tx) => {
        const deletedPermissions = await tx
          .updateTable("ResourcePermission")
          .where("userId", "=", user.id)
          .where("deletedAt", "is", null)
          .set({ deletedAt: new Date() })
          .returningAll()
          .execute()

        // For idempotency purposes since multiple nodes may run this function at the same time
        if (deletedPermissions.length === 0) return []

        return await db
          .selectFrom("Site")
          .leftJoin(
            "ResourcePermission",
            "ResourcePermission.siteId",
            "Site.id",
          )
          .innerJoin("User", "User.id", "ResourcePermission.userId")
          .where("ResourcePermission.userId", "!=", user.id) // don't want to ask users to ask themselves for permissions
          .where("ResourcePermission.userId", "not in", userIdsToDeactivate)
          .where("User.email", "not in", ISOMER_ADMINS_AND_MIGRATORS_EMAILS) // we don't want to send emails to admins and migrators
          .select([
            "Site.name as siteName",
            db.fn.agg<string[]>("array_agg", ["User.email"]).as("adminEmails"),
          ])
          .groupBy("Site.name")
          .execute()
      })
  } catch (error) {
    if (
      // Handle serializable transaction errors gracefully
      error instanceof Error &&
      "code" in error &&
      error.code === PG_ERROR_CODES.serializationFailure
    ) {
      // Return early as the user may have already been deactivated by another concurrent transaction
      return
    }
    // Re-throw other errors
    throw error
  }

  // If there are no sites and admins, we don't need to send an email
  // Note: this is to ensure there's idempotency and not send duplicate emails
  if (sitesAndAdmins.length === 0) return

  try {
    await sendAccountDeactivationEmail({
      recipientEmail: user.email,
      sitesAndAdmins,
    })
  } catch {
    logger.error(`Error sending account deactivation email for user ${user.id}`)
  }
}

export const deactiveInactiveUsers = async (): Promise<User[]> => {
  const inactiveUsers = await db
    .transaction()
    .setIsolationLevel("serializable")
    .execute(async (tx) => {
      const inactiveUsers = await getInactiveUsers({
        tx,
        daysFromLastLogin: DAYS_FROM_LAST_LOGIN,
      })

      return inactiveUsers
    })

  return inactiveUsers
}
