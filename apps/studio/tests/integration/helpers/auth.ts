import type { SetOptional } from "type-fest"
import cuid2 from "@paralleldrive/cuid2"
import { db } from "~server/db"

import type { User } from "~server/db"
import { normalizeEmail } from "~/utils/email"
import { setUpWhitelist } from "./seed"

export const auth = async ({ id, ...user }: SetOptional<User, "id">) => {
  // Ensure email is lowercase
  const normalizedUser = {
    ...user,
    email: normalizeEmail(user.email),
  }

  await setUpWhitelist({ email: normalizedUser.email })

  if (id !== undefined) {
    return db
      .updateTable("User")
      .where("id", "=", id)
      .set({ ...normalizedUser, id })
      .returningAll()
      .executeTakeFirstOrThrow()
  }
  return db
    .insertInto("User")
    .values({ ...normalizedUser, id: cuid2.createId() })
    .returningAll()
    .executeTakeFirstOrThrow()
}
