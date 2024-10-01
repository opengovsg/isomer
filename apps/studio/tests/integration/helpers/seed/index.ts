import { db } from "~server/db"

export const setupSite = async (siteId?: number) => {
  return db
    .insertInto("Site")
    .values({
      name: "Ministry of Testing and Development",
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
}

export const setupBlob = async () => {
  return db
    .insertInto("Blob")
    .values({
      content: {
        page: {
          contentPageHeader: { summary: "This is the page summary" },
        },
        layout: "content",
        content: [],
        version: "0.1.0",
      },
      createdAt: "2024-09-30 10:26:37.108",
      updatedAt: "2024-09-30 10:26:37.108",
    })
    .returning("id")
    .executeTakeFirstOrThrow()
}

export const setupPage = async ({
  siteId: siteIdProp,
  blobId: blobIdProp,
}: {
  siteId?: number
  blobId?: number
} = {}) => {
  const siteId = siteIdProp ?? (await setupSite()).id
  const blobId = blobIdProp ?? (await setupBlob()).id

  const expectedPage = await db
    .insertInto("Resource")
    .values({
      title: "test page",
      permalink: "test-page",
      siteId,
      parentId: null,
      publishedVersionId: null,
      draftBlobId: String(blobId),
      type: "Page",
      state: "Draft",
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  return {
    siteId,
    blobId,
    pageId: expectedPage.id,
  }
}
