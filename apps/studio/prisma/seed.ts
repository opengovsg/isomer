/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import cuid2 from "@paralleldrive/cuid2"

import { normalizeEmail } from "~/utils/email"
import { db, RoleType } from "../src/server/modules/database"
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

  await Promise.all(
    [EDITOR_USER, PUBLISHER_USER].map(async (name) => {
      const user = await db
        .insertInto("User")
        .values({
          id: cuid2.createId(),
          name,
          email: normalizeEmail(`${name}@open.gov.sg`),
          phone: "",
        })
        .onConflict((oc) =>
          oc
            .columns(["email", "deletedAt"])
            .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
        )
        .returning(["id", "name"])
        .executeTakeFirstOrThrow()

      const role =
        user.name === EDITOR_USER ? RoleType.Editor : RoleType.Publisher

      await db
        .insertInto("ResourcePermission")
        .values({
          userId: user.id,
          siteId,
          role,
        })
        .execute()
    }),
  )
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
