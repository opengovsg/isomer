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

const CATEGORY_GROUP = {
  id: "category-group",
  label: "Category",
  options: [{ id: "guides-option", label: "Guides" }],
}

const indexContent = (
  hasCategoryGroup: boolean,
): UnwrapTagged<PrismaJson.BlobJsonContent> =>
  ({
    layout: "collection",
    page: {
      subtitle: "Subtitle",
      sortOrder: "date-desc",
      tagCategories: hasCategoryGroup ? [CATEGORY_GROUP] : [],
    },
    content: [],
    version: "0.1.0",
  }) as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>

const createBlob = async (hasCategoryGroup: boolean) =>
  db
    .insertInto("Blob")
    .values({ content: jsonb(indexContent(hasCategoryGroup)) })
    .returning("id")
    .executeTakeFirstOrThrow()

const setupIndexSides = async ({
  collectionId,
  siteId,
  userId,
  draftHasCategory,
  publishedHasCategory,
}: {
  collectionId: string
  siteId: number
  userId: string
  draftHasCategory?: boolean
  publishedHasCategory?: boolean
}) => {
  const initialBlob = await createBlob(
    publishedHasCategory ?? draftHasCategory ?? false,
  )
  const { page } = await setupPageResource({
    resourceType: ResourceType.IndexPage,
    parentId: collectionId,
    siteId,
    blobId: initialBlob.id,
    state:
      publishedHasCategory === undefined
        ? ResourceState.Draft
        : ResourceState.Published,
    userId,
  })

  if (publishedHasCategory !== undefined && draftHasCategory !== undefined) {
    const draftBlob = await createBlob(draftHasCategory)
    await db
      .updateTable("Resource")
      .set({ draftBlobId: draftBlob.id })
      .where("id", "=", page.id)
      .execute()
  }
}

interface AuditRow {
  collection_id: string
  draft_has_category: boolean
  published_has_category: boolean
}

describe("findAsymmetricCategoryTagGroups.sql", () => {
  beforeEach(async () => {
    await resetTables("Resource", "Blob", "Version", "Site", "Navbar", "Footer")
  })

  it("returns only collections whose two present Index sides disagree on Category presence", async () => {
    // Arrange
    const { site } = await setupSite()
    const user = await setupUser({})
    const fixtures = [
      {
        permalink: "draft-only-category",
        draftHasCategory: true,
        publishedHasCategory: false,
      },
      {
        permalink: "published-only-category",
        draftHasCategory: false,
        publishedHasCategory: true,
      },
      {
        permalink: "both-have-category",
        draftHasCategory: true,
        publishedHasCategory: true,
      },
      {
        permalink: "neither-has-category",
        draftHasCategory: false,
        publishedHasCategory: false,
      },
      {
        permalink: "only-draft-side-exists",
        draftHasCategory: true,
        publishedHasCategory: undefined,
      },
    ] as const
    const collectionIds = new Map<string, string>()

    for (const fixture of fixtures) {
      const { collection } = await setupCollection({
        siteId: site.id,
        permalink: fixture.permalink,
        title: fixture.permalink,
      })
      collectionIds.set(fixture.permalink, collection.id)
      await setupIndexSides({
        collectionId: collection.id,
        siteId: site.id,
        userId: user.id,
        draftHasCategory: fixture.draftHasCategory,
        publishedHasCategory: fixture.publishedHasCategory,
      })
    }

    const query = readFileSync(
      new URL("../findAsymmetricCategoryTagGroups.sql", import.meta.url),
      "utf8",
    )

    // Act
    const result = await sql<AuditRow>`${sql.raw(query)}`.execute(db)

    // Assert
    expect(result.rows).toMatchObject([
      {
        collection_id: collectionIds.get("draft-only-category"),
        draft_has_category: true,
        published_has_category: false,
      },
      {
        collection_id: collectionIds.get("published-only-category"),
        draft_has_category: false,
        published_has_category: true,
      },
    ])
  })
})
