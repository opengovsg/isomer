/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */

import { db, RoleType } from "../src/server/modules/database"
import { addUsersToSite } from "./scripts/addUsersToSite"
import { createSite } from "./scripts/createSite"

const EDITOR_USER = "editor"
const PUBLISHER_USER = "publisher"

async function main() {
  const siteId = await createSite({ siteName: "Isomer" })

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
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await db.destroy()
  })
