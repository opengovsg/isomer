import { db, jsonb } from "~server/db"
import { nanoid } from "nanoid"

import type { ResourceType } from "~server/db"

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
        content: [],
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
}: {
  siteId?: number
  blobId?: string
  resourceType: ResourceType
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp)
  const blob = await setupBlob(blobIdProp)

  const page = await db
    .insertInto("Resource")
    .values({
      title: "test page",
      permalink: "test-page",
      siteId: site.id,
      parentId: null,
      publishedVersionId: null,
      draftBlobId: blob.id,
      type: resourceType,
      state: "Draft",
    })
    .returningAll()
    .executeTakeFirstOrThrow()

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
}: {
  siteId?: number
} = {}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp)

  const folder = await db
    .insertInto("Resource")
    .values({
      permalink: "test-folder",
      siteId: site.id,
      parentId: null,
      title: "test folder",
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
