/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */

import { createId } from "@paralleldrive/cuid2"

import { IsomerAdminRole, RoleType, db } from "../src/server/modules/database"
import { createSite } from "../src/server/modules/site/site.service"
import { addUsersToSite } from "./scripts/addUsersToSite"

const TEAM = [
  "adriangoh",
  "zhongjun",
  "jiachin",
  "harish",
  "gautam",
  "sehyun",
  "rachellin",
  "mingtingtay",
  "shazli",
]

async function main() {
  // Create XXX@open.gov.sg users (will be assigned IsomerAdmin)
  const isomerAdminUsers = await Promise.all(
    TEAM.map((username) =>
      db
        .insertInto("User")
        .values({
          id: createId(),
          email: `${username}@open.gov.sg`,
          name: "",
          phone: "",
        })
        .onConflict((oc) =>
          oc
            .columns(["email", "deletedAt"])
            .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
        )
        .returning(["id", "email"])
        .executeTakeFirstOrThrow(),
    ),
  )

  // Create "Sample Site" (gets ID 1 on a fresh DB)
  const { siteId } = await createSite({
    siteName: "Sample Site",
    userId: isomerAdminUsers[0]!.id,
  })

  // Whitelist @open.gov.sg domain
  await db
    .insertInto("Whitelist")
    .values({ email: "@open.gov.sg" })
    .onConflict((oc) =>
      oc
        .column("email")
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .executeTakeFirstOrThrow()

  // Assign IsomerAdmin (Core) to each XXX@open.gov.sg user
  await Promise.all(
    isomerAdminUsers.map(async (user) => {
      await db
        .insertInto("IsomerAdmin")
        .values({ userId: user.id, role: IsomerAdminRole.Core })
        .onConflict((oc) =>
          oc
            .columns(["userId", "role"])
            .doUpdateSet((eb) => ({ role: eb.ref("excluded.role") })),
        )
        .executeTakeFirstOrThrow()
      console.log(`IsomerAdmin assigned: ${user.email}`)
    }),
  )

  // Create XXX+editor, XXX+publisher, XXX+admin users and assign roles to site
  await Promise.all(
    TEAM.map((username) =>
      addUsersToSite({
        siteId,
        users: [
          { email: `${username}+editor@open.gov.sg`, role: RoleType.Editor },
          {
            email: `${username}+publisher@open.gov.sg`,
            role: RoleType.Publisher,
          },
          { email: `${username}+admin@open.gov.sg`, role: RoleType.Admin },
        ],
      }),
    ),
  )
}

await main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void db.destroy()
  })
