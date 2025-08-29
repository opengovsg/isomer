import { randomUUID } from "crypto"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
  CollectionPagePageProps,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { db } from "~/server/modules/database"
import { getBlobOfResource } from "~/server/modules/resource/resource.service"
import { up as addCollectionIndexPage } from "../index"

const generateDefaultBlob = (title: string) => {
  return {
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    page: {
      title,
      subtitle: `Read more on ${title.toLowerCase()} here.`,
      defaultSortBy: COLLECTION_PAGE_DEFAULT_SORT_BY,
      defaultSortDirection: COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
    } as CollectionPagePageProps,
    content: [],
    version: "0.1.0",
  }
}

describe("addCollectionIndexPage", () => {
  beforeAll(async () => {
    await db
      .insertInto("User")
      .values({
        email: "jiachin@open.gov.sg",
        phone: "12345678",
        id: randomUUID(),
        name: "",
      })
      .executeTakeFirstOrThrow()
  })
  beforeEach(async () => {
    await resetTables("Blob", "Resource")
  })

  it("should not affect collections that already have an IndexPage", async () => {
    // Arrange
    const { site, collection } = await setupCollection()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
    })
    const expected = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))

    // Act
    await addCollectionIndexPage()

    // Assert
    const actual = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))

    expect(actual.content).toEqual(expected.content)

    // Verify no new IndexPage was created for this collection
    const indexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(indexPages).toHaveLength(1)
  })

  it("should create an IndexPage for collections without one", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Verify no IndexPage exists initially
    const initialIndexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(initialIndexPages).toHaveLength(0)

    // Act
    await addCollectionIndexPage()

    // Assert
    const indexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(indexPages).toHaveLength(1)

    const indexPage = indexPages[0]
    expect(indexPage?.title).toBe(collection.title)
    expect(indexPage?.permalink).toBe(INDEX_PAGE_PERMALINK)
    expect(indexPage?.siteId).toBe(site.id)
    expect(indexPage?.state).toBe("Draft")
    expect(indexPage?.publishedVersionId).toBeNull()

    // Verify the blob content
    const blob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: indexPage!.id }))

    expect(blob.content).toEqual(generateDefaultBlob(collection.title))
  })

  it("should not affect folders", async () => {
    // Arrange
    const { site } = await setupSite()
    const folder = await db
      .insertInto("Resource")
      .values({
        title: "Test Folder",
        permalink: "/test-folder",
        siteId: site.id,
        type: ResourceType.Folder,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Act
    await addCollectionIndexPage()

    // Assert
    const indexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", folder.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()

    expect(indexPages).toHaveLength(0)
  })

  it("should handle multiple collections correctly", async () => {
    // Arrange
    const { site } = await setupSite()
    const collection1 = await db
      .insertInto("Resource")
      .values({
        title: "Collection 1",
        permalink: "/collection-1",
        siteId: site.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const collection2 = await db
      .insertInto("Resource")
      .values({
        title: "Collection 2",
        permalink: "/collection-2",
        siteId: site.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Add IndexPage to collection1 but not collection2
    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection1.id,
    })

    // Act
    await addCollectionIndexPage()

    // Assert
    // Collection1 should still have only 1 IndexPage
    const collection1IndexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection1.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(collection1IndexPages).toHaveLength(1)

    // Collection2 should now have 1 IndexPage
    const collection2IndexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection2.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(collection2IndexPages).toHaveLength(1)

    const collection2IndexPage = collection2IndexPages[0]
    expect(collection2IndexPage?.title).toBe("Collection 2")
  })

  it("should not publish the created IndexPage", async () => {
    // Arrange
    const { collection } = await setupCollection()

    // Act
    await addCollectionIndexPage()

    // Assert
    const indexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(indexPages).toHaveLength(1)

    const indexPage = indexPages[0]
    expect(indexPage?.state).toBe("Draft")
    expect(indexPage?.publishedVersionId).toBeNull()
  })

  it("should handle collections with existing child pages", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Add some child pages to the collection
    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
    })
    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionLink,
      parentId: collection.id,
    })

    // Act
    await addCollectionIndexPage()

    // Assert
    const indexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(indexPages).toHaveLength(1)

    // Verify child pages still exist
    const childPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection.id)
      .where("type", "in", [
        ResourceType.CollectionPage,
        ResourceType.CollectionLink,
      ])
      .selectAll()
      .execute()
    expect(childPages).toHaveLength(2)
  })

  it("should handle collections across different sites", async () => {
    // Arrange
    const { site: site1 } = await setupSite()
    const { site: site2 } = await setupSite()

    const collection1 = await db
      .insertInto("Resource")
      .values({
        title: "Site 1 Collection",
        permalink: "/collection",
        siteId: site1.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const collection2 = await db
      .insertInto("Resource")
      .values({
        title: "Site 2 Collection",
        permalink: "/collection",
        siteId: site2.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Act
    await addCollectionIndexPage()

    // Assert
    const site1IndexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection1.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(site1IndexPages).toHaveLength(1)
    expect(site1IndexPages[0]?.siteId).toBe(site1.id)

    const site2IndexPages = await db
      .selectFrom("Resource")
      .where("parentId", "=", collection2.id)
      .where("type", "=", ResourceType.IndexPage)
      .selectAll()
      .execute()
    expect(site2IndexPages).toHaveLength(1)
    expect(site2IndexPages[0]?.siteId).toBe(site2.id)
  })
})
