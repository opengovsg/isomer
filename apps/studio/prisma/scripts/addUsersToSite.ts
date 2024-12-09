import cuid2 from "@paralleldrive/cuid2"

import { db, RoleType } from "~/server/modules/database"

interface User {
  email: string
  name?: string
  phone?: string
}
interface AddUsersToSiteProps {
  siteId: number
  users: User[]
}
// NOTE: add them as editor first as that is the one with the least permissions
export const addUsersToSite = async ({
  siteId,
  users,
}: AddUsersToSiteProps) => {
  const processedUsers = users.map(({ email, phone, name }) => ({
    email: email.toLowerCase(),
    name: name ?? "",
    phone: phone ?? "",
  }))

  await Promise.all(
    processedUsers.map(async (props) => {
      await db.transaction().execute(async (tx) => {
        const user = await tx
          .insertInto("User")
          .values({
            id: cuid2.createId(),
            ...props,
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

const users: User[] = []

const siteId = -1

await addUsersToSite({ siteId, users })
