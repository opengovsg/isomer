/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */

import { createId } from "@paralleldrive/cuid2"

import {
  IsomerAdminRole,
  ResourceState,
  ResourceType,
  RoleType,
  db,
  jsonb,
} from "../src/server/modules/database"
import { createSite } from "../src/server/modules/site/site.service"
import { addUsersToSite } from "./scripts/addUsersToSite"

// Mirrors the publish flow in site.service.ts: blob → resource → version → link version back.
const createPage = async ({
  permalink,
  title,
  siteId,
  parentId,
  userId,
}: {
  permalink: string
  title: string
  siteId: number
  parentId?: bigint | null
  userId: string
}) => {
  const { id: blobId } = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        version: "0.1.0",
        layout: "content",
        page: { contentPageHeader: { summary: `This is the ${title} page.` } },
        content: [
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: `Welcome to the ${title} page.` },
                ],
              },
            ],
          },
        ],
      }),
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  const { id: resourceId } = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId,
      parentId: parentId ?? null,
      type: ResourceType.Page,
      state: ResourceState.Published,
      title,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  const { id: versionId } = await db
    .insertInto("Version")
    .values({ resourceId, blobId, publishedBy: userId, versionNum: 1 })
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .set({ draftBlobId: null, publishedVersionId: versionId })
    .where("id", "=", resourceId)
    .execute()

  return resourceId
}

const createFolder = async ({
  permalink,
  title,
  siteId,
  parentId,
}: {
  permalink: string
  title: string
  siteId: number
  parentId?: bigint | null
}) => {
  const { id: folderId } = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId,
      parentId: parentId ?? null,
      type: ResourceType.Folder,
      state: ResourceState.Published,
      title,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  return folderId
}

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
  const alreadySeeded = await db
    .selectFrom("Site")
    .where("name", "=", "Sample Site")
    .select("id")
    .executeTakeFirst()

  if (alreadySeeded) {
    console.log("Already seeded, skipping...")
    return
  }

  // Create XXX@open.gov.sg users (will be assigned IsomerAdmin)
  const isomerAdminUsers = await Promise.all(
    TEAM.map((username) =>
      db
        .insertInto("User")
        .values({
          id: createId(),
          email: `${username}@open.gov.sg`,
          name: username,
          phone: "12345678",
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
  const userId = isomerAdminUsers[0]?.id ?? ""
  const { siteId } = await createSite({ siteName: "Sample Site", userId })

  // Create top-level pages so footer links resolve to real pages rather than 404s
  await createPage({ permalink: "about", title: "About Us", siteId, userId })
  await createPage({
    permalink: "contact-us",
    title: "Contact Us",
    siteId,
    userId,
  })
  await createPage({
    permalink: "privacy",
    title: "Privacy Statement",
    siteId,
    userId,
  })
  await createPage({
    permalink: "terms-of-use",
    title: "Terms of Use",
    siteId,
    userId,
  })

  // Create folder + sub-pages so navbar links resolve to real pages rather than 404s
  const navFolderId = await createFolder({
    permalink: "item-one",
    title: "Expandable nav item",
    siteId,
  })
  await createPage({
    permalink: "pa-network-one",
    title: "PA's network one",
    siteId,
    parentId: navFolderId,
    userId,
  })
  await createPage({
    permalink: "pa-network-two",
    title: "PA's network two",
    siteId,
    parentId: navFolderId,
    userId,
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
          {
            name: username,
            email: `${username}+editor@open.gov.sg`,
            role: RoleType.Editor,
            phone: "12345678",
          },
          {
            name: username,
            email: `${username}+publisher@open.gov.sg`,
            role: RoleType.Publisher,
            phone: "12345678",
          },
          {
            name: username,
            email: `${username}+admin@open.gov.sg`,
            role: RoleType.Admin,
            phone: "12345678",
          },
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
