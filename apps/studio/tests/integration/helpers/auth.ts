import type { SetOptional } from "type-fest"
import cuid2 from "@paralleldrive/cuid2"
import { db } from "~server/db"

import type { User } from "~server/db"

export const auth = async ({ id, ...user }: SetOptional<User, "id">) => {
  await db
    .insertInto("Whitelist")
    .values({
      email: user.email,
    })
    .onConflict((oc) =>
      oc
        .column("email")
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .executeTakeFirstOrThrow()

  if (id !== undefined) {
    return db
      .updateTable("User")
      .where("id", "=", id)
      .set({ ...user, id })
      .returningAll()
      .executeTakeFirstOrThrow()
  }
  return db
    .insertInto("User")
    .values({ ...user, id: cuid2.createId() })
    .returningAll()
    .executeTakeFirstOrThrow()
}
