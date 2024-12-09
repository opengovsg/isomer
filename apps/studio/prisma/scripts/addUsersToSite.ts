import cuid2 from "@paralleldrive/cuid2"

import { db, RoleType } from "~/server/modules/database"

// NOTE: add them as editor first as that is the one with the least permissions
const addUsersToSite = async (siteId: number, emails: string[]) => {
  const lowercasedEmails = emails.map((email) => email.toLowerCase())

  await Promise.all(
    lowercasedEmails.map(async (email) => {
      await db.transaction().execute(async (tx) => {
        const user = await tx
          .insertInto("User")
          .values({
            id: cuid2.createId(),
            name: email.split("@")[0] || "",
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

        await tx
          .insertInto("ResourcePermission")
          .values({
            userId: user.id,
            siteId,
            role: RoleType.Editor,
          })
          .execute()
      })
    }),
  )
}

const emails = ["your email here"]

const siteId = 0

await addUsersToSite(siteId, emails)
