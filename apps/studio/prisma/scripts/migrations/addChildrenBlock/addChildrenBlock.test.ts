import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupFolder,
  setupPageResource,
} from "tests/integration/helpers/seed"

import { db, jsonb } from "~/server/modules/database"
import {
  createDefaultPage,
  createFolderIndexPage,
} from "~/server/modules/page/page.service"
import {
  getBlobOfResource,
  getPageById,
} from "~/server/modules/resource/resource.service"
import { up as addChildrenBlock } from "./addChildrenBlock"

const getCustomIndexPage = (title: string, layout: "content" | "index") => {
  return {
    page: {
      title,
      permalink: "/get-help",
      lastModified: "2025-02-25T03:49:00.242Z",
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    layout,
    content: [
      {
        type: "infocards",
        cards: [
          {
            url: "https://www.zakat.sg/how-to-apply-zakat/",
            title: "Zakat assistance",
            imageFit: "cover",
            description: "Helping the poor and needy.",
          },
          {
            url: "[resource:48:36774]",
            title: "Islamic Legacy Planning",
            imageFit: "cover",
            description:
              "Helping individuals plan and manage their assets in accordance with Islamic guidelines.",
          },
          {
            url: "[resource:48:36785]",
            title: "MUIS Special Needs Trust Scheme",
            imageFit: "cover",
            description:
              "Supporting individuals with special needs within the Muslim community.",
          },
          {
            url: "[resource:48:36784]",
            title: "Appeal Board",
            imageFit: "cover",
            description:
              "The board serves as an independent body to ensure fairness and justice in resolving disputes, offering a formal avenue for appeals.",
          },
          {
            url: "https://ask.gov.sg/muis",
            title: "FAQs",
            imageFit: "cover",
            description: "Frequently Asked Questions.",
          },
        ],
        title: "",
        variant: "cardsWithoutImages",
        subtitle: "",
        maxColumns: "1",
      },
    ],
    version: "0.1.0",
  } satisfies PrismaJson.BlobJsonContent
}

const getEmptyIndexPage = (title: string) => {
  return {
    version: "0.1.0",
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
    // NOTE: cannot use placeholder values here
    // because this are used for generation of breadcrumbs
    // and the page title
    page: {
      title,
      lastModified: new Date().toISOString(),
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    content: [],
  } satisfies PrismaJson.BlobJsonContent
}

describe("addChildrenBlock", () => {
  beforeEach(async () => {
    await resetTables("Blob", "Resource")
  })

  it("should not affect IndexPages of collections", async () => {
    // Arrange
    const { site, collection } = await setupCollection()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
    })
    const expected = await getBlobOfResource({ db, resourceId: page.id })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(expected.content)
  })
  it("should not affect IndexPages that have child blocks", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createFolderIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
  })
  it("should not add children pages block to index pages that have `layout: content`", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const customIndexPage = getCustomIndexPage(folder.title, "content")
    const blob = await db
      .insertInto("Blob")
      .values({
        content: jsonb(customIndexPage),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(customIndexPage)
  })
  it("should add children pages block at the last index of the content for index pages without content", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(getEmptyIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content.content).toEqual(
      createFolderIndexPage(folder.title).content,
    )
  })
  it("should add children pages block at the last index of the content for index pages with content", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createFolderIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
  })
  it("should not publish the change", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createFolderIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })
    expect(page.state).toBe("Draft")
    expect(page.publishedVersionId).toBeNull()

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
    const newPage = await getPageById(db, {
      resourceId: Number(page.id),
      siteId: site.id,
    })
    expect(newPage?.state).toBe("Draft")
    expect(newPage?.publishedVersionId).toBe(null)
  })
  it("should not affect non-index pages", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createDefaultPage({ layout: "content" })) })
      .returningAll()
      .executeTakeFirstOrThrow()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.Page,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addChildrenBlock()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
  })
})
