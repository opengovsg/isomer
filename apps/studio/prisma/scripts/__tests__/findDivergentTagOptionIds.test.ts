import type { UnwrapTagged } from "type-fest"
import { readFileSync } from "node:fs"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
  sql,
} from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import {
  setupCollection,
  setupPageResource,
  setupSite,
  setupUser,
} from "../../../tests/integration/helpers/seed"

interface TagOption {
  id: string
  label: string
}

interface TagGroup {
  id: string
  label: string
  options: TagOption[]
}

const indexContent = (
  tagCategories: TagGroup[],
): UnwrapTagged<PrismaJson.BlobJsonContent> =>
  ({
    layout: "collection",
    page: {
      subtitle: "Subtitle",
      sortOrder: "date-desc",
      tagCategories,
    },
    content: [],
    version: "0.1.0",
  }) as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>

const itemContent = (
  tagged: string[],
): UnwrapTagged<PrismaJson.BlobJsonContent> =>
  ({
    layout: "article",
    page: { tagged },
    content: [],
    version: "0.1.0",
  }) as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>

const createBlob = async (content: UnwrapTagged<PrismaJson.BlobJsonContent>) =>
  db
    .insertInto("Blob")
    .values({ content: jsonb(content) })
    .returning("id")
    .executeTakeFirstOrThrow()

/**
 * Creates the collection's Index with the given sides. Passing
 * `draftTagCategories: undefined` leaves the Index published-only, and
 * `publishedTagCategories: undefined` leaves it draft-only.
 */
const setupIndexSides = async ({
  collectionId,
  siteId,
  userId,
  draftTagCategories,
  publishedTagCategories,
}: {
  collectionId: string
  siteId: number
  userId: string
  draftTagCategories?: TagGroup[]
  publishedTagCategories?: TagGroup[]
}) => {
  const isPublished = publishedTagCategories !== undefined
  const initialBlob = await createBlob(
    indexContent(publishedTagCategories ?? draftTagCategories ?? []),
  )
  const { page } = await setupPageResource({
    resourceType: ResourceType.IndexPage,
    parentId: collectionId,
    siteId,
    blobId: initialBlob.id,
    state: isPublished ? ResourceState.Published : ResourceState.Draft,
    userId,
  })

  // Publishing nulls `draftBlobId`, so a two-sided Index needs its draft blob
  // attached after the fact.
  if (isPublished && draftTagCategories !== undefined) {
    const draftBlob = await createBlob(indexContent(draftTagCategories))
    await db
      .updateTable("Resource")
      .set({ draftBlobId: draftBlob.id })
      .where("id", "=", page.id)
      .execute()
  }
}

const setupPublishedItem = async ({
  collectionId,
  siteId,
  userId,
  permalink,
  tagged,
}: {
  collectionId: string
  siteId: number
  userId: string
  permalink: string
  tagged: string[]
}) => {
  const blob = await createBlob(itemContent(tagged))
  await setupPageResource({
    resourceType: ResourceType.CollectionPage,
    parentId: collectionId,
    siteId,
    blobId: blob.id,
    state: ResourceState.Published,
    userId,
    permalink,
  })
}

interface AuditRow {
  siteId: number
  collection_id: string
  collection_title: string
  group_label: string
  option_label: string
  draft_option_ids: string[]
  published_option_ids: string[]
  orphaned_option_ids: string[]
  published_items_orphaned_on_index_publish: string
}

interface Fixture {
  title: string
  draftTagCategories?: TagGroup[]
  publishedTagCategories?: TagGroup[]
  publishedItemTagged?: string[]
}

const topicGroup = ({
  groupLabel = "Topic",
  optionLabel = "News",
  optionId,
}: {
  groupLabel?: string
  optionLabel?: string
  optionId: string
}): TagGroup => ({
  id: "topic-group",
  label: groupLabel,
  options: [{ id: optionId, label: optionLabel }],
})

describe("findDivergentTagOptionIds.sql", () => {
  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
  })

  it("returns only labels present on both Index sides under different option ids", async () => {
    // Arrange
    const { site } = await setupSite()
    const user = await setupUser({})

    const fixtures: Fixture[] = [
      {
        // Divergent, and a published item already references the published id:
        // that item is what a later Index publish would orphan.
        title: "a-divergent-with-items",
        draftTagCategories: [topicGroup({ optionId: "t-news-draft" })],
        publishedTagCategories: [topicGroup({ optionId: "t-news-published" })],
        publishedItemTagged: ["t-news-published"],
      },
      {
        // Divergent but nothing points at the published id yet.
        title: "b-divergent-no-items",
        draftTagCategories: [topicGroup({ optionId: "t-news-draft" })],
        publishedTagCategories: [topicGroup({ optionId: "t-news-published" })],
      },
      {
        // Divergent despite the labels differing in case/whitespace — the
        // migration matches labels trimmed + case-insensitively, so this must
        // be reported too.
        title: "c-divergent-across-casing",
        draftTagCategories: [
          topicGroup({
            groupLabel: " topic ",
            optionLabel: " news ",
            optionId: "t-news-draft",
          }),
        ],
        publishedTagCategories: [topicGroup({ optionId: "t-news-published" })],
      },
      {
        // Same id on both sides — no divergence.
        title: "d-same-id-both-sides",
        draftTagCategories: [topicGroup({ optionId: "t-news-shared" })],
        publishedTagCategories: [topicGroup({ optionId: "t-news-shared" })],
        publishedItemTagged: ["t-news-shared"],
      },
      {
        // Same id, labels differing only by case/whitespace — normalization
        // must not manufacture a false positive.
        title: "e-same-id-across-casing",
        draftTagCategories: [
          topicGroup({
            groupLabel: "TOPIC",
            optionLabel: "NEWS",
            optionId: "t-news-shared",
          }),
        ],
        publishedTagCategories: [topicGroup({ optionId: "t-news-shared" })],
      },
      {
        // Label missing from the published side is an addition, not a
        // divergence — the migration gives it one shared id across both sides.
        title: "f-label-missing-on-published",
        draftTagCategories: [
          {
            id: "topic-group",
            label: "Topic",
            options: [
              { id: "t-news-shared", label: "News" },
              { id: "t-health-draft", label: "Health" },
            ],
          },
        ],
        publishedTagCategories: [topicGroup({ optionId: "t-news-shared" })],
      },
      {
        // Divergent, but the published id also exists in the draft Index under
        // a different group/label — so a publish would not orphan it. Pins that
        // the blast radius is computed against every draft group, not just the
        // matching label.
        title: "i-published-id-reused-elsewhere-in-draft",
        draftTagCategories: [
          topicGroup({ optionId: "t-news-draft" }),
          {
            id: "tags-group",
            label: "Tags",
            options: [{ id: "t-news-published", label: "Newsletter" }],
          },
        ],
        publishedTagCategories: [topicGroup({ optionId: "t-news-published" })],
        publishedItemTagged: ["t-news-published"],
      },
      {
        // One side only — nothing to diverge against.
        title: "g-draft-only-index",
        draftTagCategories: [topicGroup({ optionId: "t-news-draft" })],
      },
      {
        title: "h-published-only-index",
        publishedTagCategories: [topicGroup({ optionId: "t-news-published" })],
        publishedItemTagged: ["t-news-published"],
      },
    ]

    const collectionIds = new Map<string, string>()

    for (const fixture of fixtures) {
      const { collection } = await setupCollection({
        siteId: site.id,
        permalink: fixture.title,
        title: fixture.title,
      })
      collectionIds.set(fixture.title, collection.id)

      await setupIndexSides({
        collectionId: collection.id,
        siteId: site.id,
        userId: user.id,
        draftTagCategories: fixture.draftTagCategories,
        publishedTagCategories: fixture.publishedTagCategories,
      })

      if (fixture.publishedItemTagged) {
        await setupPublishedItem({
          collectionId: collection.id,
          siteId: site.id,
          userId: user.id,
          permalink: `${fixture.title}-item`,
          tagged: fixture.publishedItemTagged,
        })
      }
    }

    const query = readFileSync(
      new URL("../findDivergentTagOptionIds.sql", import.meta.url),
      "utf8",
    )

    // Act
    const result = await sql<AuditRow>`${sql.raw(query)}`.execute(db)

    // Assert
    expect(result.rows).toMatchObject([
      {
        collection_id: collectionIds.get("a-divergent-with-items"),
        collection_title: "a-divergent-with-items",
        group_label: "Topic",
        option_label: "News",
        draft_option_ids: ["t-news-draft"],
        published_option_ids: ["t-news-published"],
        orphaned_option_ids: ["t-news-published"],
        published_items_orphaned_on_index_publish: "1",
      },
      {
        collection_id: collectionIds.get("b-divergent-no-items"),
        collection_title: "b-divergent-no-items",
        draft_option_ids: ["t-news-draft"],
        published_option_ids: ["t-news-published"],
        orphaned_option_ids: ["t-news-published"],
        published_items_orphaned_on_index_publish: "0",
      },
      {
        collection_id: collectionIds.get("c-divergent-across-casing"),
        collection_title: "c-divergent-across-casing",
        // Reported with the live (published) side's casing.
        group_label: "Topic",
        option_label: "News",
        draft_option_ids: ["t-news-draft"],
        published_option_ids: ["t-news-published"],
        published_items_orphaned_on_index_publish: "0",
      },
      {
        collection_id: collectionIds.get(
          "i-published-id-reused-elsewhere-in-draft",
        ),
        collection_title: "i-published-id-reused-elsewhere-in-draft",
        draft_option_ids: ["t-news-draft"],
        published_option_ids: ["t-news-published"],
        // The published id survives a publish under another draft group, so the
        // tagged item is not orphaned despite the label-level divergence.
        orphaned_option_ids: [],
        published_items_orphaned_on_index_publish: "0",
      },
    ])
  })

  it("returns no rows when no Index has cross-side option id divergence", async () => {
    // Arrange
    const { site } = await setupSite()
    const user = await setupUser({})
    const { collection } = await setupCollection({
      siteId: site.id,
      permalink: "clean-collection",
      title: "clean collection",
    })
    await setupIndexSides({
      collectionId: collection.id,
      siteId: site.id,
      userId: user.id,
      draftTagCategories: [topicGroup({ optionId: "t-news-shared" })],
      publishedTagCategories: [topicGroup({ optionId: "t-news-shared" })],
    })

    const query = readFileSync(
      new URL("../findDivergentTagOptionIds.sql", import.meta.url),
      "utf8",
    )

    // Act
    const result = await sql<AuditRow>`${sql.raw(query)}`.execute(db)

    // Assert
    expect(result.rows).toEqual([])
  })
})
