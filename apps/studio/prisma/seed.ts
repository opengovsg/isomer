/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */

import cuid2 from "@paralleldrive/cuid2"

import { db, RoleType } from "../src/server/modules/database"
import { createSite } from "../src/server/modules/site/site.service"
import { addUsersToSite } from "./scripts/addUsersToSite"

const EDITOR_USER = "editor"
const PUBLISHER_USER = "publisher"

async function main() {
  const users = await Promise.all(
    [EDITOR_USER, PUBLISHER_USER].map(async (email) => {
      return await db
        .insertInto("User")
        .values({
          id: cuid2.createId(),
          email: `${email}@open.gov.sg`,
          name: "",
          phone: "",
        })
        .onConflict((oc) =>
          oc
            .columns(["email", "deletedAt"])
            .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
        )
        .returning(["id", "name", "email"])
        .executeTakeFirstOrThrow()
    }),
  )

  const { siteId } = await createSite({
    siteName: "Isomer",
    // @ts-expect-error - We know that the first user is always created
    userId: users[0]?.id,
  })

  await db
    .insertInto("Whitelist")
    .values({
      email: "@open.gov.sg",
    })
    .onConflict((oc) =>
      oc
        .column("email")
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .executeTakeFirstOrThrow()

  await addUsersToSite({
    siteId,
    users: [
      {
        email: `${EDITOR_USER}@open.gov.sg`,
        role: RoleType.Editor,
      },
      {
        email: `${PUBLISHER_USER}@open.gov.sg`,
        role: RoleType.Publisher,
      },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
   
  .finally(async () => {
    await db.destroy()
  })
