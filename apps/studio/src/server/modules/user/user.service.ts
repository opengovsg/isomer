import { db } from "../database"

export const isUserDeleted = async (email: string) => {
  const lowercaseEmail = email.toLowerCase()
  const user = await db
    .selectFrom("User")
    .where("email", "=", lowercaseEmail)
    .select(["deletedAt"])
    // Email is a unique field in User table
    .executeTakeFirst()

  console.log(`isUserDeleted: ${JSON.stringify(user)}`)

  if (user?.deletedAt) {
    return true
  }
  return false
}
