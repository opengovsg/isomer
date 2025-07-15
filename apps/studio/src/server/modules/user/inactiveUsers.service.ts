import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import type { DB, Site, Transaction, User } from "../database"
import type { AccountDeactivationEmailTemplateData } from "~/features/mail/templates/types"
import { sendAccountDeactivationEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db, RoleType, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { MAX_DAYS_FROM_LAST_LOGIN } from "./constants"

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

const logger = createBaseLogger({
  path: "server/modules/user/inactiveUsers.service",
})

export function getDateOnlyInSG(daysAgo: number): Date {
  return dayjs()
    .tz("Asia/Singapore")
    .subtract(daysAgo, "day")
    .startOf("day")
    .utc()
    .toDate()
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

interface DeactivateUsersProps {
  tx: Transaction<DB>
  userIds: User["id"][]
}
type DeactivateUsersOutput = {
  user: User
  siteIds: Site["id"][]
}[]

export const deactivateUsers = async ({
  tx,
  userIds,
}: DeactivateUsersProps): Promise<DeactivateUsersOutput> => {
  // prevent empty array from being passed in
  if (userIds.length === 0) return []

  const deletedPermissions = await tx
    .updateTable("ResourcePermission")
    .where("userId", "in", userIds)
    .where("deletedAt", "is", null)
    .set({ deletedAt: new Date() })
    .returningAll()
    .execute()

  const users = await tx
    .selectFrom("User")
    .where("id", "in", userIds)
    .selectAll()
    .execute()

  return users.map((user) => ({
    user,
    siteIds: deletedPermissions
      .filter((permission) => permission.userId === user.id)
      .map((permission) => permission.siteId),
  }))
}

interface GetSiteAndAdminsProps {
  tx: Transaction<DB>
  userId: User["id"]
  siteIds: Site["id"][]
}

type GetSiteAndAdminsOutput =
  AccountDeactivationEmailTemplateData["sitesAndAdmins"]

const getSiteAndAdmins = async ({
  tx,
  userId,
  siteIds,
}: GetSiteAndAdminsProps): Promise<GetSiteAndAdminsOutput> => {
  // Prevent empty array from being passed in
  if (siteIds.length === 0) return []

  return (
    tx
      .with("siteAdmins", (eb) =>
        eb
          .selectFrom("Site")
          .innerJoin(
            "ResourcePermission",
            "ResourcePermission.siteId",
            "Site.id",
          )
          .innerJoin("User", "User.id", "ResourcePermission.userId")
          .where("Site.id", "in", siteIds)
          .where("ResourcePermission.userId", "!=", userId) // don't want to ask users to ask themselves for permissions
          .where("ResourcePermission.deletedAt", "is", null)
          .where("ResourcePermission.role", "=", RoleType.Admin) // should only give the admin emails to request reactivation permissions from
          .where("User.email", "not in", ISOMER_ADMINS_AND_MIGRATORS_EMAILS) // we don't want to send emails to admins and migrators
          .select([
            "Site.id as siteId",
            db.fn.agg<string[]>("array_agg", ["User.email"]).as("adminEmails"),
          ])
          .groupBy("Site.id"),
      )
      // Needed as we still want the site records even if there are no other users with permissions for that site
      .with("baseSites", (eb) =>
        eb
          .selectFrom("Site")
          .where("Site.id", "in", siteIds)
          .select(["Site.id as siteId", "Site.name as siteName"]),
      )
      .selectFrom("baseSites")
      .leftJoin("siteAdmins", "siteAdmins.siteId", "baseSites.siteId")
      .select([
        "baseSites.siteName",
        sql<string[]>`COALESCE("siteAdmins"."adminEmails", ARRAY[]::text[])`.as(
          "adminEmails",
        ),
      ])
      .execute()
  )
}

type SendAccountDeactivationEmailsProps = AccountDeactivationEmailTemplateData[]
const sendAccountDeactivationEmails = async (
  deactivatedUsersAndSites: SendAccountDeactivationEmailsProps,
): Promise<void> => {
  for (const { recipientEmail, sitesAndAdmins } of deactivatedUsersAndSites) {
    try {
      await sendAccountDeactivationEmail({ recipientEmail, sitesAndAdmins })
    } catch {
      logger.error(
        `Error sending account deactivation email for user ${recipientEmail}`,
      )
    }
  }
}

export const bulkDeactivateInactiveUsers = async (): Promise<void> => {
  // not setting fromDaysAgo to MAX_DAYS_FROM_LAST_LOGIN because we want to
  // deactivate users beyond the MAX_DAYS_FROM_LAST_LOGIN (e.g. 91 days). This could be due to:
  // 1. legacy users who wasn't covered by the MAX_DAYS_FROM_LAST_LOGIN before the feature was introduced
  // 2. users who weren't removed for whatever reason e.g. unintentional failed cron job that wasn't retried
  const inactiveUsers = await getInactiveUsers({})

  const deactivatedUsersAndSites: SendAccountDeactivationEmailsProps = []

  try {
    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (tx) => {
        const deactivatedUsersAndSiteIds = await deactivateUsers({
          tx,
          userIds: inactiveUsers.map((user) => user.id),
        })

        for (const { user, siteIds } of deactivatedUsersAndSiteIds) {
          if (siteIds.length === 0) continue

          const sitesAndAdmins = await getSiteAndAdmins({
            tx,
            userId: user.id,
            siteIds,
          })

          deactivatedUsersAndSites.push({
            recipientEmail: user.email,
            sitesAndAdmins,
          })
        }
      })
  } catch (error) {
    if (
      // Handle serializable transaction errors gracefully - this is expected for idempotency
      error instanceof Error &&
      "code" in error &&
      error.code === PG_ERROR_CODES.serializationFailure
    ) {
      logger.info(
        "Serialization failure detected, skipping operation for idempotency",
      )
      return
    }
    // Re-throw other errors
    throw error
  }

  if (deactivatedUsersAndSites.length === 0) {
    logger.info("No deactivated users and sites found")
    return
  }

  await sendAccountDeactivationEmails(deactivatedUsersAndSites)
}
