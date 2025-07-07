import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"

import type { User } from "../database"
import type { AccountDeactivationEmailTemplateData } from "~/features/mail/templates/types"
import { sendAccountDeactivationEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db, RoleType, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { MAX_DAYS_FROM_LAST_LOGIN } from "./constants"

export const HOURS_IN_MS = 60 * 60 * 1000

const logger = createBaseLogger({
  path: "server/modules/user/inactiveUsers.service",
})

export function getDateOnlyInSG(daysAgo: number): Date {
  const now = new Date()

  // Convert to SG time
  const sgOffsetMs = 8 * HOURS_IN_MS
  const sgNow = new Date(now.getTime() + sgOffsetMs)

  // Subtract daysAgo and zero out time (SG midnight)
  sgNow.setDate(sgNow.getDate() - daysAgo)
  sgNow.setHours(0, 0, 0, 0)

  // Convert back to UTC
  const utcDate = new Date(sgNow.getTime() - sgOffsetMs)
  return utcDate
}

interface GetInactiveUsersProps {
  fromDaysAgo?: number
  toDaysAgo?: number
}
export const getInactiveUsers = async ({
  fromDaysAgo,
  toDaysAgo = MAX_DAYS_FROM_LAST_LOGIN,
}: GetInactiveUsersProps): Promise<User[]> => {
  const fromDateThreshold = fromDaysAgo ? getDateOnlyInSG(fromDaysAgo) : null
  const toDateThreshold = getDateOnlyInSG(toDaysAgo)

  return db
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
          eb("User.createdAt", "<=", toDateThreshold),
          ...(fromDateThreshold
            ? [eb("User.createdAt", ">", fromDateThreshold)]
            : []),
        ]),
        // Users who have logged in but haven't logged in for a while
        eb.and([
          eb("User.lastLoginAt", "is not", null),
          eb("User.lastLoginAt", "<=", toDateThreshold),
          ...(fromDateThreshold
            ? [eb("User.lastLoginAt", ">", fromDateThreshold)]
            : []),
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
  // This should not happen as this sub-function is only called when there are users to deactivate
  // Nevertheless, needed to add this as a safety net to ensure valid Kysely query
  if (userIdsToDeactivate.length === 0) return

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

        const siteIdsUserHasPermissionsFor = deletedPermissions.map(
          (p) => p.siteId,
        )

        return await tx
          .with("siteAdmins", (eb) =>
            eb
              .selectFrom("Site")
              .leftJoin(
                "ResourcePermission",
                "ResourcePermission.siteId",
                "Site.id",
              )
              .innerJoin("User", "User.id", "ResourcePermission.userId")
              .where("Site.id", "in", siteIdsUserHasPermissionsFor)
              .where("ResourcePermission.userId", "!=", user.id) // don't want to ask users to ask themselves for permissions
              .where("ResourcePermission.userId", "not in", userIdsToDeactivate)
              .where("ResourcePermission.deletedAt", "is", null)
              .where("ResourcePermission.role", "=", RoleType.Admin) // should only give the admin emails to request reactivation permissions from
              .where("User.email", "not in", ISOMER_ADMINS_AND_MIGRATORS_EMAILS) // we don't want to send emails to admins and migrators
              .select([
                "Site.id as siteId",
                db.fn
                  .agg<string[]>("array_agg", ["User.email"])
                  .as("adminEmails"),
              ])
              .groupBy("Site.id"),
          )
          // Needed as we still want the site records even if there are no other users with permissions for that site
          .with("baseSites", (eb) =>
            eb
              .selectFrom("Site")
              .where("Site.id", "in", siteIdsUserHasPermissionsFor)
              .select(["Site.id as siteId", "Site.name as siteName"]),
          )
          .selectFrom("baseSites")
          .leftJoin("siteAdmins", "siteAdmins.siteId", "baseSites.siteId")
          .select([
            "baseSites.siteName",
            sql`COALESCE("siteAdmins"."adminEmails", ARRAY[]::text[])`.as(
              "adminEmails",
            ),
          ])
          .execute()
          .then(
            (result) =>
              result as AccountDeactivationEmailTemplateData["sitesAndAdmins"],
          )
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

export const bulkDeactivateInactiveUsers = async (): Promise<void> => {
  // not setting fromDaysAgo to MAX_DAYS_FROM_LAST_LOGIN because we want to
  // deactivate users beyond the MAX_DAYS_FROM_LAST_LOGIN (e.g. 91 days). This could be due to:
  // 1. legacy users who wasn't covered by the MAX_DAYS_FROM_LAST_LOGIN before the feature was introduced
  // 2. users who weren't removed for whatever reason e.g. unintentional failed cron job that wasn't retried
  const inactiveUsers = await getInactiveUsers({})

  const userIdsToDeactivate = inactiveUsers.map((user) => user.id)

  for (const user of inactiveUsers) {
    await deactivateUser({ user, userIdsToDeactivate })
  }
}
