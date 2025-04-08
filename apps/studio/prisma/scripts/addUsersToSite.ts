import cuid2 from "@paralleldrive/cuid2"

import { db, RoleType } from "~/server/modules/database"

interface User {
  email: string
  name?: string
  phone?: string
  role?: RoleType
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
  const processedUsers = users.map(({ email, phone, name, role }) => ({
    email: email.toLowerCase(),
    name: name ?? "",
    phone: phone ?? "",
    role: role ?? RoleType.Editor,
  }))

  await Promise.all(
    processedUsers.map(async ({ role, ...props }) => {
      await db.transaction().execute(async (tx) => {
        const user = await tx
          .insertInto("User")
          .values({
            id: cuid2.createId(),
            ...props,
          })
          .onConflict((oc) =>
            oc
              .columns(["email", "deletedAt"])
              .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
          )
          .returning(["id", "name", "email"])
          .executeTakeFirstOrThrow()

        await tx
          .insertInto("ResourcePermission")
          .values({
            userId: user.id,
            siteId,
            role,
          })
          .execute()

        console.log(`User added: ${user.email} with id: ${user.id}`)
      })
    }),
  )
}

// NOTE: Update the list of users and siteId here before executing!
const users: User[] = []
const siteId = -1

await addUsersToSite({ siteId, users })
