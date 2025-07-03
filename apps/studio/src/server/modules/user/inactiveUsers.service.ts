import type { DB, Transaction, User } from "../database"
import { db } from "../database"

export const DAYS_IN_MS = 24 * 60 * 60 * 1000
export const DAYS_FROM_LAST_LOGIN = 90 // hardcoded to 90 as per IM8 requirement

interface GetInactiveUsersProps {
  tx: Transaction<DB>
  daysFromLastLogin: number
}
const getInactiveUsers = async ({
  tx,
  daysFromLastLogin,
}: GetInactiveUsersProps): Promise<User[]> => {
  const dateThreshold = new Date(Date.now() - daysFromLastLogin * DAYS_IN_MS)

  return tx
    .selectFrom("User")
    .where("deletedAt", "is", null)
    .where((eb) =>
      eb.or([
        // Users who have never logged in
        eb.and([
          eb("lastLoginAt", "is", null),
          eb("createdAt", "<", dateThreshold),
        ]),
        // Users who have logged in but haven't logged in for a while
        eb.and([
          eb("lastLoginAt", "is not", null),
          eb("lastLoginAt", "<", dateThreshold),
        ]),
      ]),
    )
    .selectAll()
    .execute()
}

export const removeInactiveUsers = async (): Promise<User[]> => {
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
