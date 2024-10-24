import { db, jsonb } from "~server/db"
import { nanoid } from "nanoid"

import type { ResourceState, ResourceType } from "~server/db"

export const setupAdminPermissions = async ({
  userId,
  siteId,
}: {
  userId?: string
  siteId: number
}) => {
  if (!userId) throw new Error("userId is a required field")

  await db
    .insertInto("ResourcePermission")
    .values({
      userId: String(userId),
      siteId,
      role: "Admin",
      resourceId: null,
    })
    .execute()
}

export const setupSite = async (siteId?: number, fetch?: boolean) => {
  if (siteId !== undefined && fetch) {
    return db.transaction().execute(async (tx) => {
      const site = await tx
        .selectFrom("Site")
        .where("id", "=", siteId)
        .selectAll()
        .executeTakeFirstOrThrow()

      const navbar = await tx
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const footer = await tx
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      return { site, navbar, footer }
    })
  }
  return await db.transaction().execute(async (tx) => {
    const site = await tx
      .insertInto("Site")
      .values({
        name: `Ministry of Testing and Development ${nanoid()}`,
        // @ts-expect-error not using the specific config for tests, no need to populate
        config: {
          theme: "isomer-next",
          logoUrl: "",
          siteName: "TST",
          isGovernment: true,
        },
        id: siteId,
        codeBuildId: null,
        theme: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Insert navbar
    const navbar = await tx
      .insertInto("Navbar")
      .values({
        content: jsonb([
          {
            url: "/item-one",
            name: "Expandable nav item",
            items: [
              {
                url: "/item-one/pa-network-one",
                name: "PA's network one",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
              {
                url: "/item-one/pa-network-two",
                name: "PA's network two",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
              { url: "/item-one/pa-network-three", name: "PA's network three" },
              {
                url: "/item-one/pa-network-four",
                name: "PA's network four",
                description:
                  "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              },
              {
                url: "/item-one/pa-network-five",
                name: "PA's network five",
                description:
                  "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              },
              {
                url: "/item-one/pa-network-six",
                name: "PA's network six",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
            ],
          },
        ]),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // // Insert footer
    const footer = await tx
      .insertInto("Footer")
      .values({
        content: jsonb({
          siteNavItems: [
            { url: "/about", title: "About us" },
            { url: "/partners", title: "Our partners" },
            { url: "/grants-and-programmes", title: "Grants and programmes" },
            { url: "/contact-us", title: "Contact us" },
            { url: "/something-else", title: "Something else" },
            { url: "/resources", title: "Resources" },
          ],
          contactUsLink: "/contact-us",
          termsOfUseLink: "/terms-of-use",
          feedbackFormLink: "https://www.form.gov.sg",
          privacyStatementLink: "/privacy",
        }),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return { site, navbar, footer }
  })
}

export const setupBlob = async (blobId?: string) => {
  if (blobId !== undefined) {
    return db
      .selectFrom("Blob")
      .where("id", "=", blobId)
      .selectAll()
      .executeTakeFirstOrThrow()
  }
  return db
    .insertInto("Blob")
    .values({
      content: jsonb({
        page: {
          contentPageHeader: { summary: "This is the page summary" },
        },
        layout: "content",
        content: [
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ text: "Test block", type: "text" }],
              },
            ],
          },
          {
            type: "callout",
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ text: "Test Callout content", type: "text" }],
                },
              ],
            },
          },
        ],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const setupPageResource = async ({
  siteId: siteIdProp,
  blobId: blobIdProp,
  resourceType,
  state = "Draft",
  userId,
  permalink,
  parentId,
  title,
}: {
  siteId?: number
  blobId?: string
  resourceType: ResourceType
  state?: ResourceState
  userId?: string
  permalink?: string
  parentId?: string | null
  title?: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)
  const blob = await setupBlob(blobIdProp)

  let page = await db
    .insertInto("Resource")
    .values({
      title: title ?? (resourceType === "RootPage" ? "Home" : "test page"),
      permalink: permalink ?? (resourceType === "RootPage" ? "" : "test-page"),
      siteId: site.id,
      parentId,
      publishedVersionId: null,
      draftBlobId: blob.id,
      type: resourceType,
      state,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  if (state === "Published" && userId) {
    const version = await db
      .insertInto("Version")
      .values({
        versionNum: 1,
        resourceId: page.id,
        blobId: blob.id,
        publishedBy: userId,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    page = await db
      .updateTable("Resource")
      .where("id", "=", page.id)
      .set({
        publishedVersionId: version.id,
        draftBlobId: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return {
    site,
    navbar,
    footer,
    blob,
    page,
  }
}

export const setupFolder = async ({
  siteId: siteIdProp,
  permalink = "test-folder",
  parentId = null,
  title = "test folder",
}: {
  siteId?: number
  permalink?: string
  parentId?: string | null
  title?: string
} = {}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const folder = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId: site.id,
      parentId,
      title,
      draftBlobId: null,
      state: "Draft",
      type: "Folder",
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    site,
    navbar,
    footer,
    folder,
  }
}
