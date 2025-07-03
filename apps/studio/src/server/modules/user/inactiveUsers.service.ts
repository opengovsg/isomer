import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"

import type { DB, Transaction, User } from "../database"
import { db } from "../database"

export const DAYS_IN_MS = 24 * 60 * 60 * 1000
export const DAYS_FROM_LAST_LOGIN = 90 // hardcoded to 90 as per IM8 requirement

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
    .execute()
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
