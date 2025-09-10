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
import { LegacyTag, up as migrateCollectionTags, TagCategories } from "../index"

const getTagLabelById = (tagId: UUID, categories: TagCategories): string => {
  const tags = categories.flatMap(({ options }) => options)

  return tags.find(({ id }) => {
    return id === tagId
  })?.label!
}

const createCollectionPageWithTags = (tags: LegacyTag[]) => {
  return {
    layout: "link",
    page: {
      title: "Test Page",
      category: "Test Category",
      description: "Test description",
      date: "12/12/2024",
      ref: "[resource:1:123]",
      tags,
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
    },
    content: [],
    version: "0.1.0",
  } as UnwrapTagged<PrismaJson.BlobJsonContent>
}

describe("collection-tags migration", async () => {
  const session = await applyAuthedSession()
  beforeAll(async () => {
    await db
      .insertInto("User")
      .values({
        email: "jiachin@open.gov.sg",
        id: randomUUID(),
        name: "test user",
        phone: "99999999",
      })
      .execute()
  })
  beforeEach(async () => {
    await resetTables("Blob", "Resource", "Version")
  })

  it("should not affect collections without tags", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    const { page: indexPage } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
    })

    // Create regular collection page without tags
    const pageBlob = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          layout: "link",
          page: {
            title: "Test Page",
            category: "Test Category",
            description: "Test description",
          },
          content: [],
          version: "0.1.0",
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    const expectedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    // Act
    await migrateCollectionTags()

    // Assert
    const actualIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )

    expect(actualIndexBlob.content).toEqual(expectedIndexBlob.content)
  })

  it("should migrate collection with single category and multiple options", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
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

    // Create collection pages with tags
    const tagsData = [
      [{ category: "Brand", selected: ["Apple", "Samsung"] }],
      [{ category: "Brand", selected: ["Google"] }],
    ]

    const collectionPages = []
    for (const tags of tagsData) {
      const pageBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(createCollectionPageWithTags(tags)) })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        blobId: pageBlob.id,
        permalink: randomUUID(),
      })

      collectionPages.push(page)
    }

    // Act
    await migrateCollectionTags()

    // Assert
    // Check index page has tag categories
    const updatedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    expect((updatedIndexBlob.content.page as any).tagCategories).toBeDefined()

    const tagCategories = updatedIndexBlob.content.page.tagCategories
    const categoryIds = Object.keys(tagCategories)
    expect(categoryIds).toHaveLength(1)

    const brandCategory = tagCategories[categoryIds[0]]
    expect(brandCategory.label).toBe("Brand")
    expect(Object.keys(brandCategory.options)).toHaveLength(3) // Apple, Samsung, Google

    const optionLabels = Object.values(brandCategory.options).map(
      (opt: any) => opt.label,
    )
    expect(optionLabels).toContain("Apple")
    expect(optionLabels).toContain("Samsung")
    expect(optionLabels).toContain("Google")

    const expectedValues = tagsData.map((tags) => {
      return tags.flatMap(({ selected }) => {
        return selected
      })
    })

    let idx = 0
    // Check collection pages have 'tagged' instead of 'tags'
    for (const collectionPage of collectionPages) {
      const updatedPageBlob = await db.transaction().execute((tx) =>
        getBlobOfResource({
          tx,
          resourceId: collectionPage.id,
        }),
      )
      expect(updatedPageBlob.content.page.tags).toBeDefined() // Original tags preserved
      expect(updatedPageBlob.content.page.tagged).toBeDefined() // New tagged field added
      expect(updatedPageBlob.content.page.tagged).toBeInstanceOf(Array)
      expect(updatedPageBlob.content.page.tagged.length).toBeGreaterThan(0)
      const tagIds = updatedPageBlob.content.page.tagged as UUID[]
      const labels = tagIds.map((id) => getTagLabelById(id, tagCategories))
      expect(labels).toEqual(expectedValues[idx])
      idx += 1
    }
  })

  it("should migrate collection with multiple categories", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
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

    // Create collection page with multiple tag categories
    const tags = [
      { category: "Brand", selected: ["Apple", "Samsung"] },
      { category: "Type", selected: ["Phone", "Tablet"] },
      { category: "Color", selected: ["Black"] },
    ]

    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionPageWithTags(tags)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Act
    await migrateCollectionTags()

    // Assert
    const updatedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    const tagCategories = updatedIndexBlob.content.page.tagCategories

    expect(Object.keys(tagCategories)).toHaveLength(3)

    // Check each category exists with correct options
    const categoryLabels = Object.values(tagCategories).map(
      (cat: any) => cat.label,
    )
    expect(categoryLabels).toContain("Brand")
    expect(categoryLabels).toContain("Type")
    expect(categoryLabels).toContain("Color")

    // Check Brand category has 2 options
    const brandCategory = Object.values(tagCategories).find(
      (cat: any) => cat.label === "Brand",
    )
    expect(Object.keys(brandCategory.options)).toHaveLength(2)

    // Check collection page has transformed tagged values
    const updatedPageBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))
    expect(updatedPageBlob.content.page.tagged).toHaveLength(5) // 2+2+1
    const tagIds = updatedPageBlob.content.page.tagged as UUID[]
    const labels = tagIds.map((id) => getTagLabelById(id, tagCategories))
    // NOTE: ensure that the tags are equal before/after
    expect(labels.toSorted()).toEqual(
      tags.flatMap(({ selected }) => selected).toSorted(),
    )
  })

  it("should handle collections with no index page gracefully", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection page with tags but NO index page
    const tags = [{ category: "Brand", selected: ["Apple"] }]
    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionPageWithTags(tags)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Act & Assert
    await expect(migrateCollectionTags()).rejects.toThrow()
  })

  it("should preserve existing page properties while adding tagged field", async () => {
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

    const originalPageContent = createCollectionPageWithTags([
      { category: "Brand", selected: ["Apple"] },
    ])

    const pageBlob = await db
      .insertInto("Blob")
      .values({ content: jsonb(originalPageContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
      blobId: pageBlob.id,
    })

    // Act
    await migrateCollectionTags()

    // Assert
    const updatedPageBlob = await db
      .transaction()
      .execute((tx) => getBlobOfResource({ tx, resourceId: page.id }))
    const updatedPage = updatedPageBlob.content.page

    // Check original properties are preserved
    expect(updatedPage.title).toBe(originalPageContent.page.title)
    expect(updatedPage.category).toBe(originalPageContent.page.category)
    expect(updatedPage.description).toBe(originalPageContent.page.description)
    expect(updatedPage.date).toBe(originalPageContent.page.date)
    expect(updatedPage.ref).toBe(originalPageContent.page.ref)
    expect(updatedPage.image).toEqual(originalPageContent.page.image)

    // Check original tags are preserved and tagged field is added
    expect(updatedPage.tags).toEqual(originalPageContent.page.tags)
    expect(updatedPage.tagged).toBeDefined()
    expect(updatedPage.tagged).toBeInstanceOf(Array)
  })

  it("should handle multiple collections independently", async () => {
    // Arrange
    const { site } = await setupSite()

    // Create first collection
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

    const indexBlob1 = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage("Collection 1")) })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection1.id,
      blobId: indexBlob1.id,
    })

    // Create second collection
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

    const indexBlob2 = await db
      .insertInto("Blob")
      .values({ content: jsonb(createCollectionIndexPage("Collection 2")) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page: indexPage2 } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: collection2.id,
      blobId: indexBlob2.id,
    })

    // Add tags to collection 1 only
    const pageBlob1 = await db
      .insertInto("Blob")
      .values({
        content: jsonb(
          createCollectionPageWithTags([
            { category: "Brand", selected: ["Apple"] },
          ]),
        ),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection1.id,
      blobId: pageBlob1.id,
    })

    // Collection 2 has no pages with tags
    const pageBlob2 = await db
      .insertInto("Blob")
      .values({
        content: jsonb({
          layout: "link",
          page: { title: "No tags page" },
          content: [],
          version: "0.1.0",
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.CollectionPage,
      parentId: collection2.id,
      blobId: pageBlob2.id,
    })

    const expectedIndexBlob2 = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage2.id,
      }),
    )
    // Act
    await migrateCollectionTags()

    // Assert
    // Collection 2 should be unchanged (no tags)
    const actualIndexBlob2 = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage2.id,
      }),
    )
    expect(actualIndexBlob2.content).toEqual(expectedIndexBlob2.content)
  })

  it("should handle pages with both draft and published blobs containing tags", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
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
      state: "Published",
      userId: session.userId,
    })

    // Create draft blob with different tags
    const draftBlob = await db
      .insertInto("Blob")
      .values({
        content: jsonb(
          createCollectionPageWithTags([
            { category: "Brand", selected: ["Samsung"] },
          ]),
        ),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Create published blob with different tags
    const publishedBlob = await db
      .insertInto("Blob")
      .values({
        content: jsonb(
          createCollectionPageWithTags([
            { category: "Brand", selected: ["Apple"] },
          ]),
        ),
      })
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

    await db
      .updateTable("Resource")
      .set({ draftBlobId: draftBlob.id })
      .where("id", "=", page.id)
      .execute()

    // Act
    await migrateCollectionTags()

    // Assert - should process draft blob (takes precedence)
    const tagCategories = (
      await db.transaction().execute((tx) => {
        return getBlobOfResource({ tx, resourceId: indexPage.id })
      })
    ).content.page.tagCategories

    const updatedDraftBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: page.id,
      }),
    )
    expect(updatedDraftBlob.content.page.tagged).toBeDefined()
    expect(updatedDraftBlob.content.page.tagged).toBeInstanceOf(Array)
    expect(updatedDraftBlob.content.page.tagged.length).toBeGreaterThan(0)
    const tagIds = updatedDraftBlob.content.page.tagged as UUID[]
    const labels = tagIds.map((id) => getTagLabelById(id, tagCategories))
    expect(labels).toEqual(["Samsung"])
  })

  it("should handle empty collections gracefully", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page but no other pages
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

    const expectedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    // Act
    await migrateCollectionTags()

    // Assert - should not modify empty collections
    const actualIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    expect(actualIndexBlob.content).toEqual(expectedIndexBlob.content)
  })

  it("should handle identical tag option labels across different categories", async () => {
    // Arrange
    const { site, collection } = await setupCollection()

    // Create collection index page
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

    // Create collection pages with identical option labels in different categories
    const tagsData = [
      [
        { category: "Brand", selected: ["Pro"] },
        { category: "Model", selected: ["Pro"] }, // Same label "Pro" in different category
      ],
      [
        { category: "Brand", selected: ["Apple"] },
        { category: "Color", selected: ["Apple"] }, // Same label "Apple" in different category
      ],
      [
        { category: "Model", selected: ["Pro", "Standard"] },
        { category: "Type", selected: ["Standard"] }, // "Standard" appears in both categories
      ],
    ]

    const collectionPages = []
    for (const tags of tagsData) {
      const pageBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(createCollectionPageWithTags(tags)) })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        blobId: pageBlob.id,
        permalink: randomUUID(),
      })

      collectionPages.push(page)
    }

    // Act
    await migrateCollectionTags()

    // Assert
    const updatedIndexBlob = await db.transaction().execute((tx) =>
      getBlobOfResource({
        tx,
        resourceId: indexPage.id,
      }),
    )
    const tagCategories = updatedIndexBlob.content.page.tagCategories

    // Should have 4 categories: Brand, Model, Color, Type
    expect(Object.keys(tagCategories)).toHaveLength(4)

    // Verify that identical labels in different categories are treated as separate options
    // with different UUIDs but same labelToId mapping (this is the collision issue)
    const allOptionIds = new Set<string>()
    const labelCounts: Record<string, number> = {}

    Object.values(tagCategories).forEach((category: any) => {
      Object.values(category.options).forEach((option: any) => {
        allOptionIds.add(option.id)
        labelCounts[option.label] = (labelCounts[option.label] || 0) + 1
      })
    })

    // Check that we have the collision scenario: same labels in different categories
    expect(labelCounts["Pro"]).toBe(2) // Appears in Brand and Model
    expect(labelCounts["Apple"]).toBe(2) // Appears in Brand and Color
    expect(labelCounts["Standard"]).toBe(2) // Appears in Model and Type

    // Verify that collection pages have correct tagged values
    // The bug is that labelToId maps the same string to the same UUID
    // regardless of which category it belongs to
    for (let i = 0; i < collectionPages.length; i++) {
      const updatedPageBlob = await db.transaction().execute((tx) =>
        getBlobOfResource({
          tx,
          resourceId: collectionPages[i].id,
        }),
      )

      expect(updatedPageBlob.content.page.tagged).toBeDefined()
      expect(updatedPageBlob.content.page.tagged).toBeInstanceOf(Array)

      const tagIds = updatedPageBlob.content.page.tagged as UUID[]
      const labels = tagIds.map((id) => getTagLabelById(id, tagCategories))

      // Verify that the labels match the original selected values
      const expectedLabels = tagsData[i].flatMap(({ selected }) => selected)
      expect(labels.sort()).toEqual(expectedLabels.sort())
    }

    // The critical assertion: identical labels should map to the same UUID
    // This demonstrates the collision issue in labelToId mapping
    const brandCategory = Object.values(tagCategories).find(
      (cat: any) => cat.label === "Brand",
    )
    const modelCategory = Object.values(tagCategories).find(
      (cat: any) => cat.label === "Model",
    )

    const brandProOption = Object.values(brandCategory.options).find(
      (opt: any) => opt.label === "Pro",
    )
    const modelProOption = Object.values(modelCategory.options).find(
      (opt: any) => opt.label === "Pro",
    )

    // This assertion will demonstrate the bug: same label gets same UUID across categories
    expect(brandProOption.id).not.toBe(modelProOption.id)
  })
})
