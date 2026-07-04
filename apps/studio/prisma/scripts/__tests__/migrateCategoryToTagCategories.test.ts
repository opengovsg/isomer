import type { UnwrapTagged } from "type-fest"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import {
  setupCollection,
  setupCollectionPage,
  setupPageResource,
  setupSite,
  setupUser,
} from "../../../tests/integration/helpers/seed"
import {
  appendTagged,
  buildCategoryTagGroup,
  buildMigrationPlan,
  deriveDistinctCategories,
  hasCategoryGroup,
  migrateCollection,
  migrateSite,
  type TagCategoryGroup,
} from "../migrateCategoryToTagCategories"

const setupCollectionIndexPage = async ({
  collectionId,
  siteId,
  tagCategories,
  state = ResourceState.Draft,
  userId,
}: {
  collectionId: string
  siteId?: number
  tagCategories?: TagCategoryGroup[]
  state?: ResourceState
  userId?: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "collection",
        page: {
          subtitle: "Subtitle",
          sortOrder: "date-desc",
          tagCategories,
        },
        content: [],
        version: "0.1.0",
      } as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const { page } = await setupPageResource({
    resourceType: ResourceType.IndexPage,
    parentId: collectionId,
    siteId,
    blobId: blob.id,
    state,
    userId,
  })

  return { page, blob }
}

interface TestBlobPage {
  category?: string
  tagged?: string[]
  tagCategories?: TagCategoryGroup[]
}

const getBlobContent = async (
  blobId: string,
): Promise<{ page: TestBlobPage }> => {
  const row = await db
    .selectFrom("Blob")
    .where("id", "=", blobId)
    .select("content")
    .executeTakeFirstOrThrow()
  return row.content as unknown as { page: TestBlobPage }
}

// Group A: pure unit tests — no DB required
describe("deriveDistinctCategories", () => {
  it("dedupes and sorts alphabetically", () => {
    // Act
    const result = deriveDistinctCategories([
      "Zebra",
      "Apple",
      "Zebra",
      "Mango",
    ])

    // Assert
    expect(result).toEqual(["Apple", "Mango", "Zebra"])
  })

  it("trims whitespace and drops empty/undefined values", () => {
    // Act
    const result = deriveDistinctCategories([
      " Guides ",
      "",
      undefined,
      "Guides",
    ])

    // Assert
    expect(result).toEqual(["Guides"])
  })

  it("returns an empty array for no input", () => {
    // Act + Assert
    expect(deriveDistinctCategories([])).toEqual([])
  })
})

describe("hasCategoryGroup", () => {
  it("returns false when tagCategories is undefined", () => {
    expect(hasCategoryGroup(undefined)).toBe(false)
  })

  it("returns false when no group is labelled Category", () => {
    expect(hasCategoryGroup([{ id: "1", label: "Topic", options: [] }])).toBe(
      false,
    )
  })

  it("returns true when a group is labelled Category", () => {
    expect(
      hasCategoryGroup([{ id: "1", label: "Category", options: [] }]),
    ).toBe(true)
  })
})

describe("appendTagged", () => {
  it("appends a new option id to an empty/undefined tagged array", () => {
    expect(appendTagged(undefined, "opt-1")).toEqual(["opt-1"])
  })

  it("does not duplicate an option id already present", () => {
    expect(appendTagged(["opt-1"], "opt-1")).toEqual(["opt-1"])
  })

  it("returns the array unchanged when optionId is undefined", () => {
    expect(appendTagged(["opt-1"], undefined)).toEqual(["opt-1"])
  })

  it("preserves existing entries while appending", () => {
    expect(appendTagged(["opt-1"], "opt-2")).toEqual(["opt-1", "opt-2"])
  })
})

describe("buildCategoryTagGroup", () => {
  it("builds a required Category group with one option per category, using the injected id generator", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act
    const group = buildCategoryTagGroup({
      categories: ["Articles", "Guides"],
      generateId,
    })

    // Assert
    expect(group).toEqual({
      id: "id-0",
      label: "Category",
      isRequired: true,
      options: [
        { id: "id-1", label: "Articles" },
        { id: "id-2", label: "Guides" },
      ],
    })
  })
})

describe("buildMigrationPlan", () => {
  it("returns already-migrated when a Category group already exists, making no changes", () => {
    // Arrange
    const existingTagCategories: TagCategoryGroup[] = [
      { id: "cat-1", label: "Category", options: [] },
    ]

    // Act
    const plan = buildMigrationPlan({
      tagCategories: existingTagCategories,
      items: [{ resourceId: "1", category: "Guides" }],
      existingTagged: new Map(),
    })

    // Assert
    expect(plan).toEqual({ status: "already-migrated", itemUpdates: [] })
  })

  it("returns no-categories when no item has a legacy category value", () => {
    // Act
    const plan = buildMigrationPlan({
      tagCategories: undefined,
      items: [{ resourceId: "1", category: "" }, { resourceId: "2" }],
      existingTagged: new Map(),
    })

    // Assert
    expect(plan).toEqual({ status: "no-categories", itemUpdates: [] })
  })

  it("appends the new Category group to the end of existing tagCategories", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`
    const existingTagCategories: TagCategoryGroup[] = [
      {
        id: "topic-1",
        label: "Topic",
        options: [{ id: "t-1", label: "Health" }],
      },
    ]

    // Act
    const plan = buildMigrationPlan({
      tagCategories: existingTagCategories,
      items: [{ resourceId: "1", category: "Guides" }],
      existingTagged: new Map(),
      generateId,
    })

    // Assert
    expect(plan.status).toBe("migrated")
    expect(plan.newTagCategories).toEqual([
      existingTagCategories[0],
      {
        id: "id-0",
        label: "Category",
        isRequired: true,
        options: [{ id: "id-1", label: "Guides" }],
      },
    ])
  })

  it("computes tagged updates per item, preserving existing tagged entries and skipping items with no matching category", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act
    const plan = buildMigrationPlan({
      tagCategories: undefined,
      items: [
        { resourceId: "1", category: "Guides" },
        { resourceId: "2", category: "Articles" },
        { resourceId: "3", category: "" },
        { resourceId: "4" },
      ],
      existingTagged: new Map([["1", ["existing-tag"]]]),
      generateId,
    })

    // Assert — group id-0, options sorted: Articles=id-1, Guides=id-2
    expect(plan.status).toBe("migrated")
    expect(plan.itemUpdates).toEqual([
      { resourceId: "1", tagged: ["existing-tag", "id-2"] },
      { resourceId: "2", tagged: ["id-1"] },
    ])
  })
})

// Group B: integration tests requiring a real DB
describe("migrateCollection / migrateSite", () => {
  let siteId: number

  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
    const { site } = await setupSite()
    siteId = site.id
  })

  it("dry-run reports the correct preview and writes nothing", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
    })
    const { blob: itemBlob1 } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "test-collection-page-2",
      category: "Articles",
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: true,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Articles", "Guides"])
    expect(result.itemsUpdated).toBe(2)

    const indexContent = await getBlobContent(indexBlob.id)
    expect(indexContent.page.tagCategories).toBeUndefined()

    const itemContent = await getBlobContent(itemBlob1.id)
    expect(itemContent.page.tagged).toEqual([])
  })

  it("migrates a collection: appends the Category group and tags each item, leaving `category` untouched", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTagCategories: TagCategoryGroup[] = [
      {
        id: "topic-1",
        label: "Topic",
        options: [{ id: "t-1", label: "Health" }],
      },
    ]
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: existingTagCategories,
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Guides"])
    expect(result.itemsUpdated).toBe(1)

    const indexContent = await getBlobContent(indexBlob.id)
    const newTagCategories = indexContent.page.tagCategories
    expect(newTagCategories).toHaveLength(2)
    expect(newTagCategories?.[0]).toEqual(existingTagCategories[0])
    const categoryGroup = newTagCategories?.[1]
    expect(categoryGroup?.label).toBe("Category")
    expect(categoryGroup?.isRequired).toBe(true)
    expect(categoryGroup?.options).toEqual([
      { id: expect.any(String), label: "Guides" },
    ])

    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.category).toBe("Guides") // legacy field untouched
    expect(itemContent.page.tagged).toEqual([categoryGroup?.options[0]?.id])
  })

  it("is idempotent: re-running against an already-migrated collection makes no changes", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })
    await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })
    const indexContentAfterFirstRun = await getBlobContent(indexBlob.id)
    const itemContentAfterFirstRun = await getBlobContent(itemBlob.id)

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })

    // Assert
    expect(result.status).toBe("already-migrated")
    expect(await getBlobContent(indexBlob.id)).toEqual(
      indexContentAfterFirstRun,
    )
    expect(await getBlobContent(itemBlob.id)).toEqual(itemContentAfterFirstRun)
  })

  it("skips a collection with no Index page", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })

    // Assert
    expect(result).toEqual({
      collectionId: collection.id,
      status: "no-index",
      categories: [],
      itemsUpdated: 0,
    })
  })

  it("skips items whose legacy category is empty, without failing the migration", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    await setupCollectionIndexPage({ collectionId: collection.id, siteId })
    const { blob: emptyItemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "",
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "test-collection-page-2",
      category: "Guides",
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })

    // Assert
    expect(result.categories).toEqual(["Guides"])
    expect(result.itemsUpdated).toBe(1)
    const emptyItemContent = await getBlobContent(emptyItemBlob.id)
    expect(emptyItemContent.page.tagged).toEqual([])
  })

  it("migrates the published blob when the collection is published, not just the draft", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
    })

    // Assert
    expect(result.status).toBe("migrated")
    const indexContent = await getBlobContent(indexBlob.id)
    expect(indexContent.page.tagCategories).toHaveLength(1)
    expect(indexContent.page.tagCategories?.[0]?.label).toBe("Category")

    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.tagged).toHaveLength(1)
  })

  it("migrateSite processes every collection on the site and skips collections on other sites", async () => {
    // Arrange
    const { collection: collectionA } = await setupCollection({
      siteId,
      permalink: "collection-a",
    })
    await setupCollectionIndexPage({ collectionId: collectionA.id, siteId })
    await setupCollectionPage({
      siteId,
      parentId: collectionA.id,
      category: "Guides",
    })

    const { site: otherSite } = await setupSite()
    const { collection: collectionOtherSite } = await setupCollection({
      siteId: otherSite.id,
      permalink: "collection-b",
    })
    await setupCollectionIndexPage({
      collectionId: collectionOtherSite.id,
      siteId: otherSite.id,
    })

    // Act
    const results = await migrateSite({ siteId, dryRun: false })

    // Assert
    expect(results).toHaveLength(1)
    expect(results[0]!.collectionId).toBe(collectionA.id)
    expect(results[0]!.status).toBe("migrated")
  })
})
