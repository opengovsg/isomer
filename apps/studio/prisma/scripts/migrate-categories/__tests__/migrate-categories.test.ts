// should preserve the original `tagged` property on the individual collection links and pages
// should preserve the original `tags` property on the index page
// should only add the `tagged` property to the individual collection links and pages
// should add the `tags` property to the index page
// should update the published blob to have new content, if any

import { randomUUID, UUID } from "crypto"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import {
  setupCollection,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"
import { UnwrapTagged } from "type-fest"

import { db, jsonb } from "~/server/modules/database"
import { getBlobOfResource } from "~/server/modules/resource/resource.service"
import { up as migrateCategories } from "../index"

const createCollectionPageWithCategory = (category: string) => {
  return {
    layout: "link",
    page: {
      title: "Test Page",
      category,
      description: "Test description",
      date: "12/12/2024",
      ref: "[resource:1:123]",
      // Simulate existing tagged property that should be preserved
      tagged: [randomUUID()],
      image: {
        alt: "Test image",
        src: "/test/image.jpg",
      },
    },
    content: [],
    version: "0.1.0",
  } as UnwrapTagged<PrismaJson.BlobJsonContent>
}

const createCollectionIndexPage = (title: string) => {
  return {
    layout: "collection",
    page: {
      title,
      subtitle: `Read more on ${title.toLowerCase()} here.`,
      defaultSortBy: "date",
      defaultSortDirection: "desc",
      // Simulate existing tags property that should be preserved
      tags: [
        {
          id: randomUUID(),
          label: "Existing Category",
          options: [{ label: "Existing Option", id: randomUUID() }],
        },
      ],
    },
    content: [],
    version: "0.1.0",
  } as UnwrapTagged<PrismaJson.BlobJsonContent>
}

describe("migrate-categories", async () => {
  const session = await applyAuthedSession()

  beforeEach(async () => {
    await resetTables("Blob", "Resource", "Version")
  })

  it("should preserve the original `tagged` property on the individual collection links and pages", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page with existing tags
    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage(collection.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create collection page with existing tagged property and category
    const originalTaggedId = randomUUID()
    const pageContent = createCollectionPageWithCategory("Electronics")
    // @ts-ignore
    pageContent.page.tagged = [originalTaggedId]

    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(pageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Act
    await migrateCategories()

    // Assert
    const updatedPageBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: page.id,
      }),
    )

    // @ts-ignore
    const tagged = updatedPageBlob.content.page.tagged as UUID[]
    expect(tagged).toContain(originalTaggedId) // Original tagged ID preserved
    expect(tagged.length).toBe(2) // Original + new category ID
  })

  it("should preserve the original `tags` property on the index page", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    const originalTagCategory = {
      id: randomUUID(),
      label: "Existing Category",
      options: [{ label: "Existing Option", id: randomUUID() }],
    }

    const indexPageContent = createCollectionIndexPage(collection.title)
    // @ts-ignore
    indexPageContent.page.tags = [originalTagCategory]

    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(indexPageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create collection page with category to trigger migration
    const pageBlob = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionPageWithCategory("Electronics")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Act
    await migrateCategories()

    // Assert
    const updatedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )

    // @ts-ignore
    const tags = updatedIndexBlob.content.page.tags as UUID[]
    expect(tags).toContainEqual(originalTagCategory) // Original tag preserved
    expect(tags.length).toBe(2) // Original + new Category tag
  })

  it("should only add the `tagged` property to the individual collection links and pages", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage(collection.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create collection page without existing tagged property
    const pageContent = createCollectionPageWithCategory("Electronics")
    // @ts-ignore
    delete pageContent.page.tagged // Remove the default tagged property

    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(pageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Create collection link
    const linkContent = createCollectionPageWithCategory("Books")
    // @ts-ignore
    delete linkContent.page.tagged // Remove the default tagged property

    const linkBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(linkContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: link } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionLink,
      parentId: collection.id,
      blobId: linkBlob.id,
    })

    // Act
    await migrateCategories()

    // Assert
    const updatedPageBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))
    const updatedLinkBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: link.id }))

    // Both should have tagged property added
    // @ts-ignore
    expect(updatedPageBlob.content.page.tagged).toBeDefined()
    // @ts-ignore
    expect(updatedPageBlob.content.page.tagged).toBeInstanceOf(Array)
    // @ts-ignore
    expect(updatedPageBlob.content.page.tagged.length).toBe(1)

    // @ts-ignore
    expect(updatedLinkBlob.content.page.tagged).toBeDefined()
    // @ts-ignore
    expect(updatedLinkBlob.content.page.tagged).toBeInstanceOf(Array)
    // @ts-ignore
    expect(updatedLinkBlob.content.page.tagged.length).toBe(1)
  })

  it("should add the `tags` property to the index page", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page without tags
    const indexPageContent = createCollectionIndexPage(collection.title)
    // @ts-ignore
    delete indexPageContent.page.tags // Remove the default tags property

    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(indexPageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create collection pages with categories
    const categories = ["Electronics", "Books", "Clothing"]
    for (const category of categories) {
      const pageBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb(createCollectionPageWithCategory(category)),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        blobId: pageBlob.id,
        permalink: `/${category.toLowerCase()}`,
      })
    }

    // Act
    await migrateCategories()

    // Assert
    const updatedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )

    // @ts-ignore
    const tags = updatedIndexBlob.content.page.tags as any[]
    expect(tags).toBeDefined()
    expect(tags).toBeInstanceOf(Array)
    expect(tags.length).toBe(1) // One "Category" tag category

    const categoryTag = tags[0]
    expect(categoryTag.label).toBe("Category")
    expect(categoryTag.options).toHaveLength(3) // Electronics, Books, Clothing
    expect(categoryTag.options.map((opt: any) => opt.label).sort()).toEqual([
      "Books",
      "Clothing",
      "Electronics",
    ])
  })

  it("should update the published blob to have new content, if any", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage(collection.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create published collection page with category
    const publishedContent = createCollectionPageWithCategory("Electronics")
    // @ts-ignore
    delete publishedContent.page.tagged // Start without tagged property

    const publishedBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(publishedContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: publishedBlob.id,
      state: "Published",
      userId: session.userId,
    })

    // Act
    await migrateCategories()

    // Assert - Check that published blob was updated directly
    const updatedPublishedBlob = await db
      .selectFrom("Blob")
      .where("id", "=", publishedBlob.id)
      .select("content")
      .executeTakeFirstOrThrow()

    const publishedPageContent = updatedPublishedBlob.content as any
    expect(publishedPageContent.page.tagged).toBeDefined()
    expect(publishedPageContent.page.tagged).toBeInstanceOf(Array)
    expect(publishedPageContent.page.tagged.length).toBe(1)

    // Also verify the draft blob was updated
    const updatedPageBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))
    // @ts-ignore
    expect(updatedPageBlob.content.page.tagged).toBeDefined()
  })

  it("should handle collections without categories gracefully", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    const indexBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage(collection.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      blobId: indexBlob.id,
    })

    // Create collection page without category
    const pageContent = {
      layout: "link",
      page: {
        title: "Test Page",
        description: "Test description",
        // No category property
      },
      content: [],
      version: "0.1.0",
    } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(pageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    const expectedIndexBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: indexPage.id }))

    // Act
    await migrateCategories()

    const actualIndexBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: indexPage.id }))

    // @ts-ignore
    for (const tag of expectedIndexBlob.content.page.tags) {
      // @ts-ignore
      expect(actualIndexBlob.content.page.tags).toContainEqual(tag)
    }

    // @ts-ignore
    expect(actualIndexBlob.content.page.tags.length).toEqual(
      // @ts-ignore
      expectedIndexBlob.content.page.tags.length,
    )
  })

  it("should handle multiple collections independently", async () => {
    // Arrange
    const { site } = await setupSite()

    // Create two collections
    const collection1 = await db
      .insertInto("Resource")
      .values({
        title: "Electronics Collection",
        permalink: "/electronics",
        siteId: site.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const collection2 = await db
      .insertInto("Resource")
      .values({
        title: "Books Collection",
        permalink: "/books",
        siteId: site.id,
        type: ResourceType.Collection,
        state: "Draft",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Create index pages for both collections
    const indexBlob1 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionIndexPage("Electronics Collection")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage1 } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection1.id,
      blobId: indexBlob1.id,
    })

    const indexBlob2 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionIndexPage("Books Collection")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage2 } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection2.id,
      blobId: indexBlob2.id,
    })

    // Add different categories to each collection
    const pageBlob1 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionPageWithCategory("Smartphones")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection1.id,
      blobId: pageBlob1.id,
    })

    const pageBlob2 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionPageWithCategory("Fiction")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection2.id,
      blobId: pageBlob2.id,
    })

    // Act
    await migrateCategories()

    // Assert
    const indexBlob1Updated = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: indexPage1.id }))
    const indexBlob2Updated = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: indexPage2.id }))

    // Collection 1 should have Smartphones category
    // @ts-ignore
    const tags1 = indexBlob1Updated.content.page.tags as any[]
    const categoryTag1 = tags1.find((tag: any) => tag.label === "Category")
    expect(categoryTag1).toBeDefined()
    expect(categoryTag1.options.map((opt: any) => opt.label)).toContain(
      "Smartphones",
    )

    // Collection 2 should have Fiction category
    // @ts-ignore
    const tags2 = indexBlob2Updated.content.page.tags as any[]
    const categoryTag2 = tags2.find((tag: any) => tag.label === "Category")
    expect(categoryTag2).toBeDefined()
    expect(categoryTag2.options.map((opt: any) => opt.label)).toContain(
      "Fiction",
    )

    // Verify they don't interfere with each other
    // @ts-ignore
    expect(categoryTag1.options.map((opt: any) => opt.label)).not.toContain(
      "Fiction",
    )
    // @ts-ignore
    expect(categoryTag2.options.map((opt: any) => opt.label)).not.toContain(
      "Smartphones",
    )
  })

  it("should handle collections across different sites", async () => {
    // Arrange
    const { site: site1 } = await setupSite()
    const { site: site2 } = await setupSite()

    // Create collections on different sites
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

    // Create index pages and collection pages for both
    const indexBlob1 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionIndexPage("Site 1 Collection")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site1.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection1.id,
      blobId: indexBlob1.id,
    })

    const indexBlob2 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionIndexPage("Site 2 Collection")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site2.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection2.id,
      blobId: indexBlob2.id,
    })

    // Add pages with categories to both collections
    const pageBlob1 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionPageWithCategory("Category1")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site1.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection1.id,
      blobId: pageBlob1.id,
    })

    const pageBlob2 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(createCollectionPageWithCategory("Category2")),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site2.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection2.id,
      blobId: pageBlob2.id,
    })

    // Act & Assert - should not throw errors and process both sites
    await expect(migrateCategories()).resolves.not.toThrow()
  })
})
