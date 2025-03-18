import cuid2 from "@paralleldrive/cuid2"

import type { DB, Transaction, User } from "../../database"
import { logUserEvent } from "../../audit/audit.service"
import { AuditLogEvent } from "../../database"

interface GetOrCreateUserParams {
  tx: Transaction<DB>
  email: string
}

export const upsertUser = async ({
  tx,
  email,
}: GetOrCreateUserParams): Promise<User> => {
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
    await tx
      .updateTable("User")
      .set({
        lastLoginAt: new Date(),
      })
      .where("id", "=", possibleUser.id)
      .execute()

    return possibleUser
  }

  const newUser = await tx
    .insertInto("User")
    .values({
      id: cuid2.createId(),
      email,
      phone: "", // NOTE: The phone number is added in a later step by the user
      name: emailName,
      lastLoginAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

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
