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
  appendTaggedMany,
  buildMigrationPlan,
  buildTagGroupsFromLegacyTags,
  collateLegacyTags,
  filterGroupsToAdd,
  hasMatchingTagGroup,
  main,
  migrateCollection,
  migrateSite,
  reconcileMigrationWork,
  resolveOptionIdsFromLegacyTags,
  resolveSiteIds,
  type LegacyTag,
  type TagCategoryGroup,
  verifyUser,
} from "../migrateTagsToTagCategories"

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
  tags?: LegacyTag[]
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
describe("collateLegacyTags", () => {
  it("dedupes categories and options, trims whitespace, and drops empties", () => {
    // Act
    const result = collateLegacyTags([
      [
        { category: " Topic ", selected: [" Health ", "News", ""] },
        { category: "Topic", selected: ["Health", "Sports"] },
        { category: "", selected: ["Ignored"] },
        { category: "Region", selected: [] },
      ],
      undefined,
      [{ category: "Region", selected: [" North "] }],
    ])

    // Assert
    expect(Array.from(result.keys()).sort()).toEqual(["Region", "Topic"])
    expect(Array.from(result.get("Topic")!).sort()).toEqual([
      "Health",
      "News",
      "Sports",
    ])
    expect(Array.from(result.get("Region")!)).toEqual(["North"])
  })

  it("returns an empty map when nothing usable is present", () => {
    expect(
      collateLegacyTags([[], undefined, [{ category: " ", selected: ["  "] }]])
        .size,
    ).toBe(0)
  })
})

describe("buildTagGroupsFromLegacyTags", () => {
  it("builds sorted groups with pills display and a stable id map", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`
    const mappings = new Map<string, Set<string>>([
      ["Topic", new Set(["News", "Health"])],
      ["Audience", new Set(["Public"])],
    ])

    // Act
    const { groups, optionIdByCategoryAndLabel } = buildTagGroupsFromLegacyTags(
      { mappings, generateId },
    )

    // Assert — groups sorted by label: Audience, Topic
    // id order: Audience group, Public option, Topic group, Health, News
    expect(groups).toEqual([
      {
        id: "id-0",
        label: "Audience",
        display: "pills",
        options: [{ id: "id-1", label: "Public" }],
      },
      {
        id: "id-2",
        label: "Topic",
        display: "pills",
        options: [
          { id: "id-3", label: "Health" },
          { id: "id-4", label: "News" },
        ],
      },
    ])
    expect(optionIdByCategoryAndLabel.get("Topic")?.get("Health")).toBe("id-3")
    expect(optionIdByCategoryAndLabel.get("Audience")?.get("Public")).toBe(
      "id-1",
    )
  })
})

describe("appendTaggedMany / resolveOptionIdsFromLegacyTags", () => {
  it("appendTaggedMany appends without duplicating", () => {
    expect(appendTaggedMany(undefined, ["a", "b"])).toEqual(["a", "b"])
    expect(appendTaggedMany(["a"], ["a", "b"])).toEqual(["a", "b"])
    expect(appendTaggedMany(["a"], [])).toEqual(["a"])
  })

  it("resolves option ids from legacy tags, scoped by category", () => {
    const optionIdByCategoryAndLabel = new Map([
      [
        "Topic",
        new Map([
          ["Health", "t-health"],
          ["News", "t-news"],
        ]),
      ],
      ["Region", new Map([["North", "r-north"]])],
    ])

    expect(
      resolveOptionIdsFromLegacyTags(
        [
          { category: "Topic", selected: ["Health", "News", "Health"] },
          { category: "Region", selected: ["North", ""] },
          { category: "Missing", selected: ["X"] },
        ],
        optionIdByCategoryAndLabel,
      ),
    ).toEqual(["t-health", "t-news", "r-north"])
  })
})

describe("hasMatchingTagGroup", () => {
  it("returns false for undefined/empty tagCategories", () => {
    expect(hasMatchingTagGroup(undefined, ["Topic"])).toBe(false)
    expect(hasMatchingTagGroup([], ["Topic"])).toBe(false)
  })

  it("matches an existing group label case-insensitively, trimmed", () => {
    const tagCategories: TagCategoryGroup[] = [
      { id: "g-1", label: " Topic ", options: [] },
    ]
    expect(hasMatchingTagGroup(tagCategories, ["topic"])).toBe(true)
    expect(hasMatchingTagGroup(tagCategories, ["Region"])).toBe(false)
  })
})

describe("buildMigrationPlan", () => {
  it("returns no-tags when no item has usable legacy tags on either side", () => {
    expect(
      buildMigrationPlan({
        items: [
          { resourceId: "1", draftTags: [] },
          {
            resourceId: "2",
            publishedTags: [{ category: "Topic", selected: [] }],
          },
        ],
      }),
    ).toEqual({ status: "no-tags", itemUpdates: [], groups: [] })
  })

  it("collects tags from both draft and published sides and tags each side independently", () => {
    // Arrange
    let counter = 0
    const generateId = () => `id-${counter++}`

    // Act
    const plan = buildMigrationPlan({
      items: [
        {
          resourceId: "1",
          publishedTags: [{ category: "Topic", selected: ["Health"] }],
          publishedTagged: ["existing"],
        },
        {
          resourceId: "2",
          draftTags: [{ category: "Region", selected: ["North"] }],
        },
        {
          resourceId: "3",
          draftTags: [{ category: "Topic", selected: ["News"] }],
          publishedTags: [{ category: "Topic", selected: ["Health"] }],
        },
      ],
      generateId,
    })

    // Assert — groups sorted: Region, Topic
    // id order: Region group, North; Topic group, Health, News
    expect(plan.status).toBe("migrated")
    if (plan.status !== "migrated") return
    expect(plan.groups.map((g) => g.label)).toEqual(["Region", "Topic"])
    expect(plan.groups[1]?.options.map((o) => o.label)).toEqual([
      "Health",
      "News",
    ])

    const regionNorth = plan.groups[0]?.options[0]?.id // id-1
    const topicHealth = plan.groups[1]?.options[0]?.id // id-3
    const topicNews = plan.groups[1]?.options[1]?.id // id-4

    expect(plan.itemUpdates).toEqual([
      {
        resourceId: "1",
        state: "published",
        tagged: ["existing", topicHealth],
      },
      { resourceId: "2", state: "draft", tagged: [regionNorth] },
      { resourceId: "3", state: "draft", tagged: [topicNews] },
      { resourceId: "3", state: "published", tagged: [topicHealth] },
    ])
  })
})

describe("reconcileMigrationWork", () => {
  it("appends only missing groups and backfills item tags using existing option ids", () => {
    // Arrange
    const existingTopicGroup: TagCategoryGroup = {
      id: "topic-1",
      label: "Topic",
      display: "pills",
      options: [{ id: "t-health", label: "Health" }],
    }
    const items = [
      {
        resourceId: "1",
        draftTags: [
          { category: "Topic", selected: ["Health"] },
          { category: "Region", selected: ["North"] },
        ],
      },
    ]
    let counter = 0
    const generateId = () => `new-id-${counter++}`
    const plan = buildMigrationPlan({ items, generateId })
    if (plan.status !== "migrated") throw new Error("expected migrated plan")

    // Act
    const reconciled = reconcileMigrationWork({
      plan,
      draftTagCategories: [existingTopicGroup],
      publishedTagCategories: undefined,
      items,
    })

    // Assert
    expect(reconciled.draftGroupsToAdd.map((group) => group.label)).toEqual([
      "Region",
    ])
    expect(reconciled.itemUpdates[0]?.tagged).toEqual([
      "t-health",
      expect.any(String),
    ])
    expect(reconciled.isFullyMigrated).toBe(false)
  })
})

describe("filterGroupsToAdd", () => {
  it("returns only groups whose labels are not already present", () => {
    const existing: TagCategoryGroup[] = [
      { id: "g-1", label: "Topic", options: [] },
    ]
    const candidates: TagCategoryGroup[] = [
      { id: "g-2", label: "Topic", options: [] },
      { id: "g-3", label: "Region", options: [] },
    ]

    expect(filterGroupsToAdd(existing, candidates).map((g) => g.label)).toEqual(
      ["Region"],
    )
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
      tags: [{ category: "Topic", selected: ["Health"] }],
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "test-collection-page-2",
      tags: [{ category: "Topic", selected: ["News"] }],
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
    expect(result.groups).toEqual([
      { label: "Topic", options: ["Health", "News"] },
    ])
    expect(result.itemsUpdated).toBe(2)
    expect(result.versionsCreated).toBe(0)

    const indexContentAfter = await getBlobContent(indexBlob.id)
    expect(indexContentAfter.page.tagCategories).toBeUndefined()

    const itemContent = await getBlobContent(itemBlob1.id)
    expect(itemContent.page.tagged).toEqual([])
    expect(itemContent.page.tags).toEqual([
      { category: "Topic", selected: ["Health"] },
    ])
  })

  it("migrates a draft-only collection in place: appends tag groups and tags each item, leaving `tags` untouched", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTagCategories: TagCategoryGroup[] = [
      {
        id: "category-1",
        label: "Category",
        isRequired: true,
        display: "plaintext",
        options: [{ id: "c-1", label: "Guides" }],
      },
    ]
    const { blob: indexBlob, page: indexPage } = await setupCollectionIndexPage(
      {
        collectionId: collection.id,
        siteId,
        tagCategories: existingTagCategories,
      },
    )
    const legacyTags: LegacyTag[] = [
      { category: "Topic", selected: ["Health", "News"] },
    ]
    const { blob: itemBlob, page: itemPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      tagged: ["c-1"],
      tags: legacyTags,
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
    expect(result.groups).toEqual([
      { label: "Topic", options: ["Health", "News"] },
    ])
    expect(result.itemsUpdated).toBe(1)
    expect(result.versionsCreated).toBe(0)

    const indexContentAfter = await getBlobContent(indexBlob.id)
    const newTagCategories = indexContentAfter.page.tagCategories
    expect(newTagCategories).toHaveLength(2)
    // Existing Category group (including plaintext display) is preserved
    expect(newTagCategories?.[0]).toEqual(existingTagCategories[0])
    const topicGroup = newTagCategories?.[1]
    expect(topicGroup?.label).toBe("Topic")
    expect(topicGroup?.display).toBe("pills")
    expect(topicGroup?.options).toEqual([
      { id: expect.any(String), label: "Health" },
      { id: expect.any(String), label: "News" },
    ])

    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.tags).toEqual(legacyTags) // legacy field untouched
    expect(itemContent.page.tagged).toEqual([
      "c-1",
      topicGroup?.options[0]?.id,
      topicGroup?.options[1]?.id,
    ])

    const indexResource = await getResource(indexPage.id)
    expect(indexResource.publishedVersionId).toBeNull()
    expect(indexResource.draftBlobId).toBe(indexBlob.id)
    const itemResource = await getResource(itemPage.id)
    expect(itemResource.publishedVersionId).toBeNull()
    expect(itemResource.draftBlobId).toBe(itemBlob.id)
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
      tags: [{ category: "Topic", selected: ["Health"] }],
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
    expect(indexContentAfter.page.tagCategories?.[0]?.label).toBe("Topic")
    expect(indexContentAfter.page.tagCategories?.[0]?.display).toBe("pills")

    const itemResourceAfter = await getResource(itemPage.id)
    expect(itemResourceAfter.draftBlobId).toBeNull()
    const itemVersion = await getVersion(itemResourceAfter.publishedVersionId!)
    expect(itemVersion.versionNum).toBe(2)
    const itemContentAfter = await getBlobContent(itemVersion.blobId)
    expect(itemContentAfter.page.tagged).toHaveLength(1)
    expect(itemContentAfter.page.tags).toEqual([
      { category: "Topic", selected: ["Health"] },
    ])
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
      tags: [{ category: "Topic", selected: ["Health"] }],
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

  it("handles diverging draft vs. published content: draft updated in place, published via a new Version, each tagged for its own tags", async () => {
    // Arrange
    const user = await setupUser({})
    const { collection } = await setupCollection({ siteId })

    const publishedTagCategories: TagCategoryGroup[] = [
      {
        id: "category-1",
        label: "Category",
        display: "plaintext",
        options: [{ id: "c-1", label: "Guides" }],
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
        id: "extra-1",
        label: "Extra",
        display: "pills",
        options: [{ id: "e-1", label: "Keep" }],
      },
    ]
    const indexDraftBlob = await addStaleDraft(
      indexPage.id,
      indexContent(draftTagCategories),
    )

    // Item A: published only
    const { page: itemAPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "item-a",
      tags: [{ category: "Topic", selected: ["Health"] }],
      state: ResourceState.Published,
      userId: user.id,
    })

    // Item B: published Health, stale draft changed to News
    const { page: itemBPage } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "item-b",
      tags: [{ category: "Topic", selected: ["Health"] }],
      state: ResourceState.Published,
      userId: user.id,
    })
    const itemBDraftBlob = await addStaleDraft(
      itemBPage.id,
      collectionPageBlobContent([], "Feature Articles", [
        { category: "Topic", selected: ["News"] },
      ]),
    )

    // Item C: draft-only Region
    const { page: itemCPage, blob: itemCDraftBlob } = await setupCollectionPage(
      {
        siteId,
        parentId: collection.id,
        permalink: "item-c",
        tags: [{ category: "Region", selected: ["North"] }],
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
    expect(result.groups.map((g) => g.label)).toEqual(["Region", "Topic"])
    expect(result.itemsUpdated).toBe(3)
    // index + itemA (published) + itemB (published) — itemC is draft-only
    expect(result.versionsCreated).toBe(3)

    // Index draft: prior groups preserved (including Category plaintext), new groups appended
    const indexDraftContentAfter = await getBlobContent(indexDraftBlob.id)
    expect(indexDraftContentAfter.page.tagCategories).toHaveLength(4)
    expect(indexDraftContentAfter.page.tagCategories?.[0]).toEqual(
      publishedTagCategories[0],
    )
    expect(indexDraftContentAfter.page.tagCategories?.[1]).toEqual(
      draftTagCategories[1],
    )
    const draftRegionGroup = indexDraftContentAfter.page.tagCategories?.[2]
    const draftTopicGroup = indexDraftContentAfter.page.tagCategories?.[3]
    expect(draftRegionGroup?.label).toBe("Region")
    expect(draftTopicGroup?.label).toBe("Topic")
    expect(draftTopicGroup?.display).toBe("pills")

    // Index published: new Version, own prior array kept, same new groups appended
    const indexResourceAfter = await getResource(indexPage.id)
    expect(indexResourceAfter.draftBlobId).toBe(indexDraftBlob.id)
    const indexPublishedVersion = await getVersion(
      indexResourceAfter.publishedVersionId!,
    )
    expect(indexPublishedVersion.versionNum).toBe(2)
    expect(indexPublishedVersion.blobId).not.toBe(indexPublishedBlob.id)
    const indexPublishedContentAfter = await getBlobContent(
      indexPublishedVersion.blobId,
    )
    expect(indexPublishedContentAfter.page.tagCategories).toHaveLength(3)
    expect(indexPublishedContentAfter.page.tagCategories?.[0]).toEqual(
      publishedTagCategories[0],
    )
    expect(indexPublishedContentAfter.page.tagCategories?.[1]).toEqual(
      draftRegionGroup,
    )
    expect(indexPublishedContentAfter.page.tagCategories?.[2]).toEqual(
      draftTopicGroup,
    )

    const optionIdByLabel = new Map(
      draftTopicGroup?.options.map((o) => [o.label, o.id]),
    )
    const regionNorthId = draftRegionGroup?.options[0]?.id

    // Item A: published-only
    const itemAResourceAfter = await getResource(itemAPage.id)
    expect(itemAResourceAfter.draftBlobId).toBeNull()
    const itemAVersion = await getVersion(
      itemAResourceAfter.publishedVersionId!,
    )
    const itemAContentAfter = await getBlobContent(itemAVersion.blobId)
    expect(itemAContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Health"),
    ])

    // Item B: draft tagged for News in place; published tagged for Health via new Version
    const itemBResourceAfter = await getResource(itemBPage.id)
    expect(itemBResourceAfter.draftBlobId).toBe(itemBDraftBlob.id)
    const itemBDraftContentAfter = await getBlobContent(itemBDraftBlob.id)
    expect(itemBDraftContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("News"),
    ])
    const itemBVersion = await getVersion(
      itemBResourceAfter.publishedVersionId!,
    )
    const itemBPublishedContentAfter = await getBlobContent(itemBVersion.blobId)
    expect(itemBPublishedContentAfter.page.tags).toEqual([
      { category: "Topic", selected: ["Health"] },
    ])
    expect(itemBPublishedContentAfter.page.tagged).toEqual([
      optionIdByLabel.get("Health"),
    ])

    // Item C: draft-only
    const itemCResourceAfter = await getResource(itemCPage.id)
    expect(itemCResourceAfter.publishedVersionId).toBeNull()
    expect(itemCResourceAfter.draftBlobId).toBe(itemCDraftBlob.id)
    const itemCContentAfter = await getBlobContent(itemCDraftBlob.id)
    expect(itemCContentAfter.page.tagged).toEqual([regionNorthId])
  })

  it("skips a collection with no Index page", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      tags: [{ category: "Topic", selected: ["Health"] }],
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
      groups: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    })
  })

  it("skips a collection only when every group and item tag is already present", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTopicGroup: TagCategoryGroup = {
      id: "topic-1",
      label: "Topic",
      display: "pills",
      options: [{ id: "t-health", label: "Health" }],
    }
    const { blob: indexBlob } = await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [existingTopicGroup],
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      tags: [{ category: "Topic", selected: ["Health"] }],
      tagged: ["t-health"],
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
      groups: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    })
    const indexContentAfter = await getBlobContent(indexBlob.id)
    expect(indexContentAfter.page.tagCategories).toEqual([existingTopicGroup])
    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.tagged).toEqual(["t-health"])
  })

  it("backfills item tagged UUIDs when the Index group already exists", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    const existingTopicGroup: TagCategoryGroup = {
      id: "topic-1",
      label: "Topic",
      display: "pills",
      options: [{ id: "t-health", label: "Health" }],
    }
    await setupCollectionIndexPage({
      collectionId: collection.id,
      siteId,
      tagCategories: [existingTopicGroup],
    })
    const { blob: itemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      tags: [{ category: "Topic", selected: ["Health"] }],
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
    expect(result.itemsUpdated).toBe(1)
    const itemContent = await getBlobContent(itemBlob.id)
    expect(itemContent.page.tagged).toEqual(["t-health"])
  })

  it("skips items without usable tags without failing the migration", async () => {
    // Arrange
    const { collection } = await setupCollection({ siteId })
    await setupCollectionIndexPage({ collectionId: collection.id, siteId })
    const { blob: emptyItemBlob } = await setupCollectionPage({
      siteId,
      parentId: collection.id,
      tags: [{ category: "Topic", selected: [] }],
    })
    await setupCollectionPage({
      siteId,
      parentId: collection.id,
      permalink: "test-collection-page-2",
      tags: [{ category: "Topic", selected: ["Health"] }],
    })

    // Act
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    expect(result.groups).toEqual([{ label: "Topic", options: ["Health"] }])
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
      tags: [{ category: "Topic", selected: ["Health"] }],
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
    const results = await migrateSite({
      siteId,
      dryRun: false,
      publisherId: null,
    })

    // Assert
    expect(results).toHaveLength(1)
    expect(results[0]!.collectionId).toBe(collectionA.id)
    expect(results[0]!.status).toBe("migrated")
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
      resolveSiteIds({ include: [siteA.id, siteB.id], exclude: [siteB.id] }),
    ).resolves.toEqual([siteA.id])
  })

  it("throws when an include id does not exist", async () => {
    await expect(
      resolveSiteIds({ include: [999_999], exclude: [] }),
    ).rejects.toThrow("Site ID(s) not found: 999999")
  })
})

describe("verifyUser", () => {
  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
  })

  it("resolves when the user exists", async () => {
    const user = await setupUser({})
    await expect(verifyUser(user.id)).resolves.toEqual({ id: user.id })
  })

  it("throws when the user does not exist", async () => {
    await expect(verifyUser("no-such-user")).rejects.toThrow(
      "User no-such-user not found",
    )
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

  it("does not prompt for a publisher id in --dry-run mode", async () => {
    await main(["--dry-run"], {
      siteIdsInclude: [siteId],
      siteIdsExclude: [],
    })
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(input).not.toHaveBeenCalled()
  })

  it("prompts for and verifies a publisher id outside --dry-run mode", async () => {
    const user = await setupUser({})
    vi.mocked(input).mockResolvedValue(user.id)

    await main([], { siteIdsInclude: [siteId], siteIdsExclude: [] })

    expect(confirm).toHaveBeenCalledTimes(1)
    expect(input).toHaveBeenCalledTimes(1)
  })

  it("rejects when the prompted publisher id does not exist", async () => {
    vi.mocked(input).mockResolvedValue("no-such-user")

    await expect(
      main([], { siteIdsInclude: [siteId], siteIdsExclude: [] }),
    ).rejects.toThrow("User no-such-user not found")
  })

  it("aborts without migrating when confirm is declined", async () => {
    vi.mocked(confirm).mockResolvedValue(false)

    await main([], { siteIdsInclude: [siteId], siteIdsExclude: [] })

    expect(input).not.toHaveBeenCalled()
  })

  it("processes every included site and skips excluded ones", async () => {
    const { site: otherSite } = await setupSite()

    await main(["--dry-run"], {
      siteIdsInclude: [siteId, otherSite.id],
      siteIdsExclude: [otherSite.id],
    })

    // dry-run mode never prompts for a publisher id, regardless of site count
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(input).not.toHaveBeenCalled()
  })
})
