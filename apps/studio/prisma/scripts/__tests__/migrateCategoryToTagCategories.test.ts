import type { UnwrapTagged } from "type-fest"

vi.mock("@inquirer/prompts")

import { confirm, input } from "@inquirer/prompts"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import {
  collectionPageBlobContent,
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
  lookupUserByEmail,
  main,
  migrateCollection,
  migrateSite,
  resolveSiteIds,
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

const getResource = (resourceId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow()

const getVersion = (versionId: string) =>
  db
    .selectFrom("Version")
    .where("id", "=", versionId)
    .select(["versionNum", "blobId"])
    .executeTakeFirstOrThrow()

/** Simulates an unpublished edit made after a resource was already published. */
const addStaleDraft = async (
  resourceId: string,
  content: UnwrapTagged<PrismaJson.BlobJsonContent>,
) => {
  const draftBlob = await db
    .insertInto("Blob")
    .values({ content: jsonb(content) })
    .returningAll()
    .executeTakeFirstOrThrow()
  await db
    .updateTable("Resource")
    .set({ draftBlobId: draftBlob.id })
    .where("id", "=", resourceId)
    .execute()
  return draftBlob
}

const indexContent = (
  tagCategories?: TagCategoryGroup[],
): UnwrapTagged<PrismaJson.BlobJsonContent> =>
  ({
    layout: "collection",
    page: { subtitle: "Subtitle", sortOrder: "date-desc", tagCategories },
    content: [],
    version: "0.1.0",
  }) as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>

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

  it("dedupes case-insensitively, keeping the first-seen trimmed casing", () => {
    // Act
    const result = deriveDistinctCategories([
      " Guides ",
      "guides",
      "GUIDES",
      "Articles",
    ])

    // Assert — matches Studio tag-option duplicate rules (trim + lower)
    expect(result).toEqual(["Articles", "Guides"])
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

describe("hasCategoryGroup", () => {
  it("returns false when tagCategories is missing or empty", () => {
    expect(hasCategoryGroup(undefined)).toBe(false)
    expect(hasCategoryGroup([])).toBe(false)
  })

  it("returns true when a group labeled Category is present", () => {
    expect(
      hasCategoryGroup([
        {
          id: "topic-1",
          label: "Topic",
          options: [{ id: "t-1", label: "Health" }],
        },
        {
          id: "cat-1",
          label: "Category",
          options: [{ id: "c-1", label: "Guides" }],
        },
      ]),
    ).toBe(true)
  })

  it("matches Category labels using Studio's trimmed, case-insensitive duplicate rules", () => {
    const categoryGroup: TagCategoryGroup = {
      id: "cat-1",
      label: " category ",
      options: [{ id: "c-1", label: "Guides" }],
    }

    expect(hasCategoryGroup([categoryGroup])).toBe(true)
  })

  it("returns false when other groups exist but none are labeled Category", () => {
    expect(
      hasCategoryGroup([
        {
          id: "topic-1",
          label: "Topic",
          options: [{ id: "t-1", label: "Health" }],
        },
      ]),
    ).toBe(false)
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
      display: "plaintext",
      options: [
        { id: "id-1", label: "Articles" },
        { id: "id-2", label: "Guides" },
      ],
    })
  })
})

describe("buildMigrationPlan", () => {
  it("returns no-categories when no item has a category value on either side", () => {
    // Act
    const plan = buildMigrationPlan({
      items: [
        { resourceId: "1", draftCategory: "", publishedCategory: undefined },
        { resourceId: "2" },
      ],
    })

    // Assert
    expect(plan).toEqual({ status: "no-categories", itemUpdates: [] })
  })

  it("collects categories from both draft and published values across items", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act — "Guides" only published on item 1, "Events" only in draft on item 2
    const plan = buildMigrationPlan({
      items: [
        { resourceId: "1", publishedCategory: "Guides" },
        { resourceId: "2", draftCategory: "Events" },
      ],
      generateId,
    })

    // Assert
    expect(plan.status).toBe("migrated")
    if (plan.status !== "migrated") return
    expect(plan.group).toEqual({
      id: "id-0",
      label: "Category",
      isRequired: true,
      display: "plaintext",
      options: [
        { id: "id-1", label: "Events" },
        { id: "id-2", label: "Guides" },
      ],
    })
  })

  it("tags draft and published sides independently, preserving each side's existing tagged entries", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act — options sorted: Articles=id-1, Guides=id-2
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          publishedCategory: "Guides",
          publishedTagged: ["existing-tag"],
        },
        { resourceId: "2", draftCategory: "Articles" },
        { resourceId: "3", draftCategory: "", publishedCategory: undefined },
      ],
      generateId,
    })

    // Assert
    expect(plan.status).toBe("migrated")
    expect(plan.itemUpdates).toEqual([
      {
        resourceId: "1",
        state: "published",
        tagged: ["existing-tag", "id-2"],
      },
      { resourceId: "2", state: "draft", tagged: ["id-1"] },
    ])
  })

  it("tags an item's draft and published sides differently when its category diverges between them", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act — options sorted: Forms=id-1, Guides=id-2
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          draftCategory: "Forms",
          draftTagged: [],
          publishedCategory: "Guides",
          publishedTagged: [],
        },
      ],
      generateId,
    })

    // Assert
    expect(plan.status).toBe("migrated")
    expect(plan.itemUpdates).toEqual([
      { resourceId: "1", state: "draft", tagged: ["id-1"] },
      { resourceId: "1", state: "published", tagged: ["id-2"] },
    ])
  })

  it("maps differently-cased legacy categories to the same option id", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act — first-seen casing "Guides" wins; "guides" must resolve to same option
    const plan = buildMigrationPlan({
      items: [
        { resourceId: "1", publishedCategory: "Guides" },
        { resourceId: "2", draftCategory: "guides" },
      ],
      generateId,
    })

    // Assert
    expect(plan.status).toBe("migrated")
    if (plan.status !== "migrated") return
    expect(plan.group.options).toEqual([{ id: "id-1", label: "Guides" }])
    expect(plan.itemUpdates).toEqual([
      { resourceId: "1", state: "published", tagged: ["id-1"] },
      { resourceId: "2", state: "draft", tagged: ["id-1"] },
    ])
  })

  it("reuses an existing group and only tags present item sides", () => {
    // Arrange
    const existingGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      isRequired: true,
      display: "plaintext",
      options: [{ id: "guides-option", label: "Guides" }],
    }

    // Act
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          hasDraft: false,
          hasPublished: true,
          draftCategory: "Guides",
          draftTagged: ["guides-option"],
          publishedCategory: "Guides",
          publishedTagged: [],
        },
      ],
      existingGroup,
    })

    // Assert
    expect(plan).toEqual({
      status: "migrated",
      group: existingGroup,
      itemUpdates: [
        {
          resourceId: "1",
          state: "published",
          tagged: ["guides-option"],
        },
      ],
    })
  })

  it("skips item updates when tagged is already correct", () => {
    // Arrange
    const existingGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      options: [{ id: "guides-option", label: "Guides" }],
    }

    // Act
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          publishedCategory: "Guides",
          publishedTagged: ["guides-option"],
        },
      ],
      existingGroup,
    })

    // Assert
    expect(plan).toEqual({
      status: "migrated",
      group: existingGroup,
      itemUpdates: [],
    })
  })

  it("copies an existing group when there are no legacy categories", () => {
    // Arrange
    const existingGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      options: [{ id: "guides-option", label: "Guides" }],
    }

    // Act
    const plan = buildMigrationPlan({
      items: [],
      existingGroup,
    })

    // Assert
    expect(plan).toEqual({
      status: "migrated",
      group: existingGroup,
      itemUpdates: [],
    })
  })

  it("extends an existing group for categories found only on one item side", () => {
    // Arrange
    const existingGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      options: [{ id: "guides-option", label: "Guides" }],
    }

    // Act
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          hasDraft: true,
          hasPublished: false,
          draftCategory: "Forms",
        },
      ],
      existingGroup,
      generateId: () => "forms-option",
    })

    // Assert
    expect(plan).toEqual({
      status: "migrated",
      group: {
        ...existingGroup,
        options: [
          { id: "guides-option", label: "Guides" },
          { id: "forms-option", label: "Forms" },
        ],
      },
      itemUpdates: [
        {
          resourceId: "1",
          state: "draft",
          tagged: ["forms-option"],
        },
      ],
    })
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
      publisherId: null,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Articles", "Guides"])
    expect(result.itemsUpdated).toBe(2)
    expect(result.versionsCreated).toBe(0) // nothing published in this fixture

    const indexContentAfter = await getBlobContent(indexBlob.id)
    expect(indexContentAfter.page.tagCategories).toBeUndefined()

    const itemContent = await getBlobContent(itemBlob1.id)
    expect(itemContent.page.tagged).toEqual([])
  })

  it("reads items via the caller-supplied transaction (sees uncommitted inserts)", async () => {
    // Arrange — index exists outside the tx; the only item is inserted inside it
    const { collection } = await setupCollection({ siteId })
    await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
    })

    await db.transaction().execute(async (tx) => {
      const blob = await tx
        .insertInto("Blob")
        .values({
          content: jsonb(collectionPageBlobContent([], "Guides")),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await tx
        .insertInto("Resource")
        .values({
          title: "tx-only item",
          permalink: "tx-only-item",
          siteId,
          parentId: collection.id,
          type: ResourceType.CollectionPage,
          state: ResourceState.Draft,
          draftBlobId: blob.id,
        })
        .execute()

      // Act — if reads used module-level `db`, this uncommitted item would be invisible
      const result = await migrateCollection({
        collectionId: collection.id,
        siteId,
        dryRun: true,
        publisherId: null,
        tx,
      })

      // Assert
      expect(result.status).toBe("migrated")
      expect(result.categories).toEqual(["Guides"])
      expect(result.itemsUpdated).toBe(1)
    })
  })

  it("migrates a draft-only collection in place: appends the Category group and tags each item, leaving `category` untouched", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTagCategories: TagCategoryGroup[] = [
      {
        id: "topic-1",
        label: "Topic",
        options: [{ id: "t-1", label: "Health" }],
      },
    ]
    const { blob: indexBlob, page: indexPage } = await setupCollectionIndexPage(
      {
        collectionId: collection.id,
        siteId,
        tagCategories: existingTagCategories,
      },
    )
    const { blob: itemBlob, page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Guides"])
    expect(result.itemsUpdated).toBe(1)
    expect(result.versionsCreated).toBe(0) // draft-only, nothing published

    const indexContentAfter = await getBlobContent(indexBlob.id)
    const newTagCategories = indexContentAfter.page.tagCategories
    expect(newTagCategories).toHaveLength(2)
    expect(newTagCategories?.[0]).toEqual({
      ...existingTagCategories[0],
      display: "pills",
    })
    const categoryGroup = newTagCategories?.[1]
    expect(categoryGroup?.label).toBe("Category")
    expect(categoryGroup?.isRequired).toBe(true)
    expect(categoryGroup?.display).toBe("plaintext")
    expect(categoryGroup?.options).toEqual([
      { id: expect.any(String), label: "Guides" },
    ])

    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.category).toBe("Guides") // legacy field untouched
    expect(itemContent.page.tagged).toEqual([categoryGroup?.options[0]?.id])

    // No publish should have happened — draft-only content stays draft-only
    const indexResource = await getResource(indexPage.id)
    expect(indexResource.publishedVersionId).toBeNull()
    expect(indexResource.draftBlobId).toBe(indexBlob.id)
    const itemResource = await getResource(itemPage.id)
    expect(itemResource.publishedVersionId).toBeNull()
    expect(itemResource.draftBlobId).toBe(itemBlob.id)
  })

  it("preserves explicit filter displays while defaulting legacy filters to pills", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTagCategories: TagCategoryGroup[] = [
      {
        id: "topic-1",
        label: "Topic",
        display: "plaintext",
        options: [{ id: "t-1", label: "Health" }],
      },
      {
        id: "region-1",
        label: "Region",
        options: [{ id: "r-1", label: "Central" }],
      },
    ]
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: existingTagCategories,
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
    })

    // Act
    await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    const indexContentAfter = await getBlobContent(indexBlob.id)
    expect(indexContentAfter.page.tagCategories).toEqual([
      existingTagCategories[0],
      { ...existingTagCategories[1], display: "pills" },
      expect.objectContaining({
        label: "Category",
        display: "plaintext",
      }),
    ])
  })

  it("migrates a published collection via a new Version, without touching draftBlobId", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    const { page: itemPage } = await setupCollectionPage({
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
      publisherId: user.id,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.versionsCreated).toBe(2) // index + the one published item

    const indexResourceAfter = await getResource(indexPage.id)
    expect(indexResourceAfter.draftBlobId).toBeNull()
    expect(indexResourceAfter.publishedVersionId).not.toBe(
      indexPage.publishedVersionId,
    )
    const indexVersion = await getVersion(
      indexResourceAfter.publishedVersionId!,
    )
    expect(indexVersion.versionNum).toBe(2)
    const indexContentAfter = await getBlobContent(indexVersion.blobId)
    expect(indexContentAfter.page.tagCategories).toHaveLength(1)
    expect(indexContentAfter.page.tagCategories?.[0]?.label).toBe("Category")
    expect(indexContentAfter.page.tagCategories?.[0]?.display).toBe("plaintext")

    const itemResourceAfter = await getResource(itemPage.id)
    expect(itemResourceAfter.draftBlobId).toBeNull()
    const itemVersion = await getVersion(itemResourceAfter.publishedVersionId!)
    expect(itemVersion.versionNum).toBe(2)
    const itemContentAfter = await getBlobContent(itemVersion.blobId)
    expect(itemContentAfter.page.tagged).toHaveLength(1)
  })

  it("throws when publisherId is missing outside dry-run for a collection with published content", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })

    // Act + Assert
    await expect(
      migrateCollection({
        collectionId: collection.id,
        siteId,
        dryRun: false,
        publisherId: null,
      }),
    ).rejects.toThrow("publisherId is required")
  })

  it("handles diverging draft vs. published content: draft updated in place, published via a new Version, each tagged for its own category", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })

    // Index: published with a Topic group; a later, unrelated draft edit adds
    // a Region group. Both should end up with the same Category group.
    const publishedTagCategories: TagCategoryGroup[] = [
      {
        id: "topic-1",
        label: "Topic",
        options: [{ id: "t-1", label: "Health" }],
      },
    ]
    const { page: indexPage, blob: indexPublishedBlob } =
      await setupCollectionIndexPage({
        collectionId: collection.id,
        siteId,
        tagCategories: publishedTagCategories,
        state: ResourceState.Published,
        userId: user.id,
      })
    const draftTagCategories: TagCategoryGroup[] = [
      ...publishedTagCategories,
      {
        id: "region-1",
        label: "Region",
        options: [{ id: "r-1", label: "North" }],
      },
    ]
    const indexDraftBlob = await addStaleDraft(
      indexPage.id,
      indexContent(draftTagCategories),
    )

    // Item A: published only, category "Guides"
    const { page: itemAPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "item-a",
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })

    // Item B: published "Guides", but a stale draft changed it to "Forms"
    const { page: itemBPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "item-b",
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })
    const itemBDraftBlob = await addStaleDraft(
      itemBPage.id,
      collectionPageBlobContent([], "Forms"),
    )

    // Item C: draft-only, never published, category "Events"
    const { page: itemCPage, blob: itemCDraftBlob } = await setupCollectionPage(
      {
        siteId,
        parentId: collection.id,
        permalink: "item-c",
        category: "Events",
      },
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Events", "Forms", "Guides"])
    expect(result.itemsUpdated).toBe(3)
    // index + itemA (published) + itemB (published) — itemC is draft-only
    expect(result.versionsCreated).toBe(3)

    // Index: draft updated in place (same blob row, own prior array kept,
    // pre-existing groups stamped with an explicit "pills" display)
    const indexDraftContentAfter = await getBlobContent(indexDraftBlob.id)
    expect(indexDraftContentAfter.page.tagCategories).toHaveLength(3)
    expect(indexDraftContentAfter.page.tagCategories?.[0]).toEqual({
      ...publishedTagCategories[0],
      display: "pills",
    })
    expect(indexDraftContentAfter.page.tagCategories?.[1]).toEqual({
      ...draftTagCategories[1],
      display: "pills",
    })
    const draftCategoryGroup = indexDraftContentAfter.page.tagCategories?.[2]
    expect(draftCategoryGroup?.label).toBe("Category")
    expect(draftCategoryGroup?.display).toBe("plaintext")

    // Index: published side got a new Version, with its own prior array kept
    const indexResourceAfter = await getResource(indexPage.id)
    expect(indexResourceAfter.draftBlobId).toBe(indexDraftBlob.id) // untouched
    const indexPublishedVersion = await getVersion(
      indexResourceAfter.publishedVersionId!,
    )
    expect(indexPublishedVersion.versionNum).toBe(2)
    expect(indexPublishedVersion.blobId).not.toBe(indexPublishedBlob.id)
    const indexPublishedContentAfter = await getBlobContent(
      indexPublishedVersion.blobId,
    )
    expect(indexPublishedContentAfter.page.tagCategories).toHaveLength(2)
    expect(indexPublishedContentAfter.page.tagCategories?.[0]).toEqual({
      ...publishedTagCategories[0],
      display: "pills",
    })
    const publishedCategoryGroup =
      indexPublishedContentAfter.page.tagCategories?.[1]
    expect(publishedCategoryGroup?.label).toBe("Category")

    // Same option ids reused on both sides
    expect(publishedCategoryGroup).toEqual(draftCategoryGroup)

    const optionIdByLabel = new Map(
      draftCategoryGroup?.options.map((o) => [o.label, o.id]),
    )

    // Item A: published-only, tagged via a new Version
    const itemAResourceAfter = await getResource(itemAPage.id)
    expect(itemAResourceAfter.draftBlobId).toBeNull()
    const itemAVersion = await getVersion(
      itemAResourceAfter.publishedVersionId!,
    )
    const itemAContentAfter = await getBlobContent(itemAVersion.blobId)
    expect(itemAContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Guides"),
    ])

    // Item B: draft tagged for "Forms" in place; published untouched content-wise
    // except tagged for its own "Guides" value via a new Version
    const itemBResourceAfter = await getResource(itemBPage.id)
    expect(itemBResourceAfter.draftBlobId).toBe(itemBDraftBlob.id) // in place, same row
    const itemBDraftContentAfter = await getBlobContent(itemBDraftBlob.id)
    expect(itemBDraftContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Forms"),
    ])
    const itemBVersion = await getVersion(
      itemBResourceAfter.publishedVersionId!,
    )
    const itemBPublishedContentAfter = await getBlobContent(itemBVersion.blobId)
    expect(itemBPublishedContentAfter.page.category).toBe("Guides")
    expect(itemBPublishedContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Guides"),
    ])

    // Item C: draft-only, tagged in place, never published
    const itemCResourceAfter = await getResource(itemCPage.id)
    expect(itemCResourceAfter.publishedVersionId).toBeNull()
    expect(itemCResourceAfter.draftBlobId).toBe(itemCDraftBlob.id)
    const itemCContentAfter = await getBlobContent(itemCDraftBlob.id)
    expect(itemCContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Events"),
    ])
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
      publisherId: null,
    })

    // Assert
    expect(result).toEqual({
      collectionId: collection.id,
      status: "no-index",
      categories: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    })
  })

  it("skips a collection whose Index and items are already migrated (idempotent re-run)", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingCategoryGroup: TagCategoryGroup = {
      id: "cat-1",
      label: "Category",
      isRequired: true,
      display: "plaintext",
      options: [{ id: "c-1", label: "Guides" }],
    }
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [existingCategoryGroup],
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      tagged: ["c-1"],
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    expect(result).toEqual({
      collectionId: collection.id,
      status: "already-migrated",
      categories: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    })
    const indexContentAfter = await getBlobContent(indexBlob.id)
    expect(indexContentAfter.page.tagCategories).toEqual([
      existingCategoryGroup,
    ])
    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.tagged).toEqual(["c-1"])
  })

  it("tags item drafts when the Index has no draft blob", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    const { page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })
    const itemDraftBlob = await addStaleDraft(
      itemPage.id,
      collectionPageBlobContent([], "Forms"),
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.categories).toEqual(["Forms", "Guides"])

    const indexResource = await getResource(indexPage.id)
    const publishedIndexVersion = await getVersion(
      indexResource.publishedVersionId!,
    )
    const indexTagCategories = (
      await getBlobContent(publishedIndexVersion.blobId)
    ).page.tagCategories
    expect(
      indexTagCategories?.[0]?.options.map((option) => option.label),
    ).toEqual(["Forms", "Guides"])

    expect((await getBlobContent(itemDraftBlob.id)).page.tagged).toHaveLength(1)
    expect((await getBlobContent(itemDraftBlob.id)).page.tagged?.[0]).toBe(
      indexTagCategories?.[0]?.options.find(
        (option) => option.label === "Forms",
      )?.id,
    )
  })

  it("migrates only the published side when only the draft Index has Category", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const existingCategoryGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      isRequired: true,
      display: "plaintext",
      options: [{ id: "guides-option", label: "Guides" }],
    }
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    const indexDraftBlob = await addStaleDraft(
      indexPage.id,
      indexContent([existingCategoryGroup]),
    )
    const { page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })
    const itemDraftBlob = await addStaleDraft(
      itemPage.id,
      collectionPageBlobContent(["guides-option"], "Guides"),
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.versionsCreated).toBe(2)
    expect(
      (await getBlobContent(indexDraftBlob.id)).page.tagCategories,
    ).toEqual([existingCategoryGroup])
    expect((await getBlobContent(itemDraftBlob.id)).page.tagged).toEqual([
      "guides-option",
    ])

    const indexResource = await getResource(indexPage.id)
    const publishedIndexVersion = await getVersion(
      indexResource.publishedVersionId!,
    )
    expect(
      (await getBlobContent(publishedIndexVersion.blobId)).page.tagCategories,
    ).toEqual([existingCategoryGroup])

    const itemResource = await getResource(itemPage.id)
    const publishedItemVersion = await getVersion(
      itemResource.publishedVersionId!,
    )
    expect(
      (await getBlobContent(publishedItemVersion.blobId)).page.tagged,
    ).toEqual(["guides-option"])
  })

  it("migrates only the draft side when only the published Index has Category", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const existingCategoryGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      isRequired: true,
      display: "plaintext",
      options: [{ id: "guides-option", label: "Guides" }],
    }
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [existingCategoryGroup],
      state: ResourceState.Published,
      userId: user.id,
    })
    const originalIndexVersionId = indexPage.publishedVersionId
    const indexDraftBlob = await addStaleDraft(indexPage.id, indexContent())
    const { page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      tagged: ["guides-option"],
      state: ResourceState.Published,
      userId: user.id,
    })
    const originalItemVersionId = itemPage.publishedVersionId
    const itemDraftBlob = await addStaleDraft(
      itemPage.id,
      collectionPageBlobContent([], "Guides"),
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result.status).toBe("migrated")
    expect(result.versionsCreated).toBe(0)
    expect(
      (await getBlobContent(indexDraftBlob.id)).page.tagCategories,
    ).toEqual([existingCategoryGroup])
    expect((await getBlobContent(itemDraftBlob.id)).page.tagged).toEqual([
      "guides-option",
    ])
    expect((await getResource(indexPage.id)).publishedVersionId).toBe(
      originalIndexVersionId,
    )
    expect((await getResource(itemPage.id)).publishedVersionId).toBe(
      originalItemVersionId,
    )
  })

  it("adds target-only options to both copies of a reused Category group", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const existingCategoryGroup: TagCategoryGroup = {
      id: "category-group",
      label: "Category",
      options: [{ id: "guides-option", label: "Guides" }],
    }
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [existingCategoryGroup],
      state: ResourceState.Published,
      userId: user.id,
    })
    const indexDraftBlob = await addStaleDraft(indexPage.id, indexContent())
    const { page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      category: "Guides",
      tagged: ["guides-option"],
      state: ResourceState.Published,
      userId: user.id,
    })
    const itemDraftBlob = await addStaleDraft(
      itemPage.id,
      collectionPageBlobContent([], "Forms"),
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result.versionsCreated).toBe(1)
    const draftGroups = (await getBlobContent(indexDraftBlob.id)).page
      .tagCategories
    expect(draftGroups).toHaveLength(1)
    expect(draftGroups?.[0]).toEqual({
      ...existingCategoryGroup,
      options: [
        existingCategoryGroup.options[0],
        { id: expect.any(String), label: "Forms" },
      ],
    })

    const indexResource = await getResource(indexPage.id)
    const publishedIndexVersion = await getVersion(
      indexResource.publishedVersionId!,
    )
    const publishedGroups = (await getBlobContent(publishedIndexVersion.blobId))
      .page.tagCategories
    expect(publishedGroups).toEqual(draftGroups)
    expect((await getBlobContent(itemDraftBlob.id)).page.tagged).toEqual([
      draftGroups?.[0]?.options[1]?.id,
    ])
    expect((await getResource(itemPage.id)).publishedVersionId).toBe(
      itemPage.publishedVersionId,
    )
  })

  it("reports conflicting Category groups without changing either side", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })
    const publishedGroup: TagCategoryGroup = {
      id: "published-category-group",
      label: "Category",
      options: [{ id: "published-guides-option", label: "Guides" }],
    }
    const draftGroup: TagCategoryGroup = {
      id: "draft-category-group",
      label: "Category",
      options: [{ id: "draft-guides-option", label: "Guides" }],
    }
    const { page: indexPage } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [publishedGroup],
      state: ResourceState.Published,
      userId: user.id,
    })
    const originalPublishedVersionId = indexPage.publishedVersionId
    const indexDraftBlob = await addStaleDraft(
      indexPage.id,
      indexContent([draftGroup]),
    )

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: user.id,
    })

    // Assert
    expect(result).toEqual({
      collectionId: collection.id,
      status: "conflicting-category-groups",
      categories: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    })
    expect(
      (await getBlobContent(indexDraftBlob.id)).page.tagCategories,
    ).toEqual([draftGroup])
    expect((await getResource(indexPage.id)).publishedVersionId).toBe(
      originalPublishedVersionId,
    )
  })

  it("skips items whose legacy category is empty on both sides, without failing the migration", async () => {
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
      publisherId: null,
    })

    // Assert
    expect(result.categories).toEqual(["Guides"])
    expect(result.itemsUpdated).toBe(1)
    const emptyItemContent = await getBlobContent(emptyItemBlob.id)
    expect(emptyItemContent.page.tagged).toEqual([])
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
    const siteResult = await migrateSite({
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    expect(siteResult.status).toBe("succeeded")
    expect(siteResult.collections).toHaveLength(1)
    expect(siteResult.collections[0]!.collectionId).toBe(collectionA.id)
    expect(siteResult.collections[0]!.status).toBe("migrated")
  })

  it("migrateSite rolls back every collection when one collection write fails", async () => {
    // Arrange — two collections that need published Versions (require publisherId)
    const user = await setupUser({})
    const { collection: collectionA } = await setupCollection({
      siteId,
      permalink: "collection-a",
    })
    await setupCollectionIndexPage({
      collectionId: collectionA.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    await setupCollectionPage({
      siteId,
      parentId: collectionA.id,
      category: "Guides",
      state: ResourceState.Published,
      userId: user.id,
    })

    const { collection: collectionB } = await setupCollection({
      siteId,
      permalink: "collection-b",
    })
    await setupCollectionIndexPage({
      collectionId: collectionB.id,
      siteId,
      state: ResourceState.Published,
      userId: user.id,
    })
    await setupCollectionPage({
      siteId,
      parentId: collectionB.id,
      permalink: "page-b",
      category: "Events",
      state: ResourceState.Published,
      userId: user.id,
    })

    // Act — missing publisherId forces a throw on the first published write
    const siteResult = await migrateSite({
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert — site failed and neither Index gained a Category group
    expect(siteResult.status).toBe("failed")
    for (const collection of [collectionA, collectionB]) {
      const index = await db
        .selectFrom("Resource")
        .where("parentId", "=", collection.id)
        .where("type", "=", ResourceType.IndexPage)
        .select(["draftBlobId", "publishedVersionId"])
        .executeTakeFirstOrThrow()
      if (index.draftBlobId) {
        const draft = await getBlobContent(index.draftBlobId)
        expect(hasCategoryGroup(draft.page.tagCategories)).toBe(false)
      }
      if (index.publishedVersionId) {
        const version = await db
          .selectFrom("Version")
          .where("id", "=", index.publishedVersionId)
          .select("blobId")
          .executeTakeFirstOrThrow()
        const published = await getBlobContent(version.blobId)
        expect(hasCategoryGroup(published.page.tagCategories)).toBe(false)
      }
    }
  })
})

describe("resolveSiteIds", () => {
  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
  })

  it("returns all sites when include is empty, minus exclude", async () => {
    const { site: siteA } = await setupSite()
    const { site: siteB } = await setupSite()

    await expect(
      resolveSiteIds({ include: [], exclude: [siteB.id] }),
    ).resolves.toEqual([siteA.id])
  })

  it("returns only included sites minus exclude", async () => {
    const { site: siteA } = await setupSite()
    const { site: siteB } = await setupSite()
    await setupSite()

    await expect(
      resolveSiteIds({
        include: [siteA.id, siteB.id],
        exclude: [siteB.id],
      }),
    ).resolves.toEqual([siteA.id])
  })

  it("throws when an include id does not exist", async () => {
    await expect(
      resolveSiteIds({ include: [999_999], exclude: [] }),
    ).rejects.toThrow("Site ID(s) not found: 999999")
  })
})

describe("main (CLI entrypoint)", () => {
  let siteId: number

  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
    const { site } = await setupSite()
    siteId = site.id
    vi.mocked(input).mockReset()
    vi.mocked(confirm).mockReset()
    vi.mocked(confirm).mockResolvedValue(true)
  })

  it("does not prompt for a publisher email in --dry-run mode", async () => {
    // Act
    await main(["--dry-run"], {
      siteIdsInclude: [siteId],
      siteIdsExclude: [],
      logger: { info: vi.fn(), error: vi.fn() },
    })

    // Assert
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(input).not.toHaveBeenCalled()
  })

  it("prompts for and verifies a publisher email outside --dry-run mode", async () => {
    // Arrange
    const user = await setupUser({})
    vi.mocked(input).mockResolvedValue(user.email)
    const lookupUser = vi
      .fn(lookupUserByEmail)
      .mockResolvedValue({ id: user.id })

    // Act
    await main([], {
      siteIdsInclude: [siteId],
      siteIdsExclude: [],
      logger: { info: vi.fn(), error: vi.fn() },
      lookupUser,
    })

    // Assert
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(input).toHaveBeenCalledTimes(1)
    expect(lookupUser).toHaveBeenCalledWith(user.email)
  })

  it("rejects when the prompted publisher email does not exist", async () => {
    // Arrange
    vi.mocked(input).mockResolvedValue("missing@agency.gov.sg")
    const lookupUser = vi
      .fn(lookupUserByEmail)
      .mockRejectedValue(
        new Error("User with email missing@agency.gov.sg not found"),
      )

    // Act + Assert
    await expect(
      main([], {
        siteIdsInclude: [siteId],
        siteIdsExclude: [],
        logger: { info: vi.fn(), error: vi.fn() },
        lookupUser,
      }),
    ).rejects.toThrow("User with email missing@agency.gov.sg not found")
    expect(lookupUser).toHaveBeenCalledWith("missing@agency.gov.sg")
  })

  it("aborts without migrating when confirm is declined", async () => {
    // Arrange
    vi.mocked(confirm).mockResolvedValue(false)

    // Act
    await main([], {
      siteIdsInclude: [siteId],
      siteIdsExclude: [],
      logger: { info: vi.fn(), error: vi.fn() },
    })

    // Assert
    expect(input).not.toHaveBeenCalled()
  })
})
