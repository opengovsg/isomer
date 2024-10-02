import { db, jsonb } from "~server/db"
import { nanoid } from "nanoid"

import type { ResourceType } from "~server/db"

export const setupSite = async (siteId?: number) => {
  const site = await db.transaction().execute(async (tx) => {
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
        createdAt: "2024-09-30 10:42:51.77",
        updatedAt: "2024-09-30 10:42:51.77",
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    // Insert navbar
    await tx
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
      .execute()

    // // Insert footer
    await tx
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
      .execute()

    return site
  })

  return site
}

export const setupBlob = async () => {
  return db
    .insertInto("Blob")
    .values({
      content: jsonb({
        page: {
          contentPageHeader: { summary: "This is the page summary" },
        },
        layout: "content",
        content: [],
        version: "0.1.0",
      }),
      createdAt: "2024-09-30 10:26:37.108",
      updatedAt: "2024-09-30 10:26:37.108",
    })
    .returning("id")
    .executeTakeFirstOrThrow()
}

export const setupPageResource = async ({
  siteId: siteIdProp,
  blobId: blobIdProp,
  resourceType,
}: {
  siteId?: number
  blobId?: number
  resourceType: ResourceType
}) => {
  const siteId = siteIdProp ?? (await setupSite()).id
  const blobId = blobIdProp ?? (await setupBlob()).id

  const page = await db
    .insertInto("Resource")
    .values({
      title: "test page",
      permalink: "test-page",
      siteId,
      parentId: null,
      publishedVersionId: null,
      draftBlobId: String(blobId),
      type: resourceType,
      state: "Draft",
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  return {
    siteId,
    blobId,
    pageId: page.id,
  }
}

export const setupFolder = async ({
  siteId: siteIdProp,
}: {
  siteId?: number
} = {}) => {
  const siteId = siteIdProp ?? (await setupSite()).id

  const folder = await db
    .insertInto("Resource")
    .values({
      permalink: "test-folder",
      siteId,
      parentId: null,
      title: "test folder",
      draftBlobId: null,
      state: "Draft",
      type: "Folder",
      publishedVersionId: null,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  return {
    siteId,
    folderId: folder.id,
  }
}
