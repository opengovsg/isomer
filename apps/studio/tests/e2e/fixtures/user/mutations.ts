import { db } from "~/server/modules/database"

const E2E_USER_NAME = "test-e2e"
const E2E_USER_PHONE = "82345678"

/** Exact emails only. LIKE e2e-invitee-% can delete another parallel test's user. */
export const deleteUsersByEmail = async (...emails: (string | undefined)[]) => {
  const list = emails.filter((email): email is string => !!email)
  if (list.length === 0) return

  const users = await db
    .selectFrom("User")
    .where("email", "in", list)
    .select(["id"])
    .execute()
  if (users.length === 0) return

  const ids = users.map((u) => u.id)
  await db.deleteFrom("IsomerAdmin").where("userId", "in", ids).execute()
  await db.deleteFrom("ResourcePermission").where("userId", "in", ids).execute()
  await db.deleteFrom("User").where("id", "in", ids).execute()
}

/** Set name + phone so the welcome modal does not block tests. */
export const ensureUserOnboarded = (email: string) =>
  db
    .updateTable("User")
    .set({ name: E2E_USER_NAME, phone: E2E_USER_PHONE })
    .where("email", "=", email)
    .execute()

/** Reset singpass first-login state for one user. */
export const resetUserSingpassState = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "", phone: "", singpassUuid: null })
    .where("email", "=", email)
    .execute()

export const setUserSingpassUuid = (email: string, uuid: string) =>
  db
    .updateTable("User")
    .set({ singpassUuid: uuid })
    .where("email", "=", email)
    .execute()
