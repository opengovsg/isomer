/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */

import { createId } from "@paralleldrive/cuid2"

import { db } from "../src/server/modules/database/database"
import {
  IsomerAdminRole,
  ResourceState,
  ResourceType,
  RoleType,
} from "../src/server/modules/database/types"
import { jsonb } from "../src/server/modules/database/utils"
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
  parentId?: string | null
  userId: string
}) => {
  const [{ id: blobId }, { id: resourceId }] = await Promise.all([
    db
      .insertInto("Blob")
      .values({
        content: jsonb({
          content: [
            {
              content: [
                {
                  content: [
                    { text: `Welcome to the ${title} page.`, type: "text" },
                  ],
                  type: "paragraph",
                },
              ],
              type: "prose",
            },
          ],
          layout: "content",
          page: {
            contentPageHeader: { summary: `This is the ${title} page.` },
          },
          version: "0.1.0",
        }),
      })
      .returning("id")
      .executeTakeFirstOrThrow(),
    db
      .insertInto("Resource")
      .values({
        parentId: parentId ?? null,
        permalink,
        siteId,
        state: ResourceState.Published,
        title,
        type: ResourceType.Page,
      })
      .returning("id")
      .executeTakeFirstOrThrow(),
  ])

  const { id: versionId } = await db
    .insertInto("Version")
    .values({ blobId, publishedBy: userId, resourceId, versionNum: 1 })
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
  parentId?: string | null
}) => {
  const { id: folderId } = await db
    .insertInto("Resource")
    .values({
      parentId: parentId ?? null,
      permalink,
      siteId,
      state: ResourceState.Published,
      title,
      type: ResourceType.Folder,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  return folderId
}

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

  // Create isomeradmin@open.gov.sg (will be assigned IsomerAdmin)
  const isomerAdminUser = await db
    .insertInto("User")
    .values({
      email: "isomeradmin@open.gov.sg",
      id: createId(),
      name: "isomeradmin",
      phone: "88888888",
    })
    .onConflict((oc) =>
      oc
        .columns(["email", "deletedAt"])
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .returning(["id", "email"])
    .executeTakeFirstOrThrow()

  // Create "Sample Site" (gets ID 1 on a fresh DB)
  const userId = isomerAdminUser.id
  const { siteId } = await createSite({ siteName: "Sample Site", userId })

  // Create top-level pages so footer links resolve to real pages rather than 404s
  await createPage({ permalink: "about", siteId, title: "About Us", userId })
  await createPage({
    permalink: "contact-us",
    siteId,
    title: "Contact Us",
    userId,
  })
  await createPage({
    permalink: "privacy",
    siteId,
    title: "Privacy Statement",
    userId,
  })
  await createPage({
    permalink: "terms-of-use",
    siteId,
    title: "Terms of Use",
    userId,
  })

  // Create folder + sub-pages so navbar links resolve to real pages rather than 404s
  const navFolderId = await createFolder({
    permalink: "item-one",
    siteId,
    title: "Expandable nav item",
  })
  await createPage({
    parentId: navFolderId,
    permalink: "pa-network-one",
    siteId,
    title: "PA's network one",
    userId,
  })
  await createPage({
    parentId: navFolderId,
    permalink: "pa-network-two",
    siteId,
    title: "PA's network two",
    userId,
  })

  // Whitelist @open.gov.sg domain
  await Promise.all([
    db
      .insertInto("Whitelist")
      .values({ email: "@open.gov.sg" })
      .onConflict((oc) =>
        oc
          .column("email")
          .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
      )
      .executeTakeFirstOrThrow(),
    db
      .insertInto("IsomerAdmin")
      .values({ role: IsomerAdminRole.Core, userId: isomerAdminUser.id })
      .onConflict((oc) =>
        oc
          .columns(["userId", "role"])
          .doUpdateSet((eb) => ({ role: eb.ref("excluded.role") })),
      )
      .executeTakeFirstOrThrow(),
  ])
  console.log(`IsomerAdmin assigned: ${isomerAdminUser.email}`)

  // Create role-based users and assign site roles
  await addUsersToSite({
    siteId,
    users: [
      {
        email: "editor@open.gov.sg",
        name: "editor",
        phone: "88888888",
        role: RoleType.Editor,
      },
      {
        email: "publisher@open.gov.sg",
        name: "publisher",
        phone: "88888888",
        role: RoleType.Publisher,
      },
      {
        email: "admin@open.gov.sg",
        name: "admin",
        phone: "88888888",
        role: RoleType.Admin,
      },
    ],
  })
}

await main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    void db.destroy()
  })
