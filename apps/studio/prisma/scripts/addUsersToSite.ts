import cuid2 from "@paralleldrive/cuid2"

import { db, RoleType } from "~/server/modules/database"

// NOTE: add them as editor first as that is the one with the least permissions
export const addUsersToSite = async (siteId: number, emails: string[]) => {
  const lowercasedEmails = emails.map((email) => email.toLowerCase())

  await Promise.all(
    lowercasedEmails.map(async (email) => {
      const user = await db
        .insertInto("User")
        .values({
          id: cuid2.createId(),
          name: email.split("@")[0]!,
          email,
          phone: "",
        })
        .onConflict((oc) =>
          oc
            .column("email")
            .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
        )
        .returning(["id", "name"])
        .executeTakeFirstOrThrow()

      await db
        .insertInto("ResourcePermission")
        .values({
          userId: user.id,
          siteId,
          role: RoleType.Editor,
        })
        .execute()
    }),
  )
}

const emails = ["your email here"]

const siteId = 0

addUsersToSite(siteId, emails)
