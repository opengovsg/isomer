import type { UnwrapTagged } from "type-fest"
import crypto from "crypto"
import {
  collectionPageBlobContent,
  setupCollection,
  setupCollectionLink,
  setupCollectionPage,
  setupFolder,
  setupPageResource,
} from "tests/integration/helpers/seed"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { db, jsonb } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

/** Prose preview label in the default integration seed blob. */
export const SEEDED_PROSE_BLOCK_LABEL = "Test block"

/** Callout preview label in the default integration seed blob — the second
 * of its two blocks (`setupBlob` in `tests/integration/helpers/seed`),
 * paired with `SEEDED_PROSE_BLOCK_LABEL` for reorder/multi-block tests that
 * need two distinct, already-seeded block labels. */
export const SEEDED_CALLOUT_BLOCK_LABEL = "Test Callout content"

/**
 * A standalone (non-Collection) Article-layout page. `collectionPageBlobContent`
 * produces the same `layout: "article"` / `articlePageHeader` shape used for
 * CollectionPage items — Article is a valid standalone `NEW_PAGE_LAYOUT_VALUES`
 * layout too, just seeded here directly rather than via the create-page wizard.
 */
export const seedArticlePage = async ({
  siteId,
  pageTitle = "E2E Article Page",
}: {
  siteId: number
  pageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        ...collectionPageBlobContent(),
        content: [
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ text: SEEDED_PROSE_BLOCK_LABEL, type: "text" }],
              },
            ],
          },
        ],
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: null,
    blobId: blob.id,
    title: pageTitle,
    permalink: `e2e-article-${suffix}`,
  })
  return { page }
}

/** Same shape as createCollectionIndexJson in collection.service.ts. */
const collectionIndexBlobContent = (
  title: string,
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  layout: "collection",
  page: {
    title,
    subtitle:
      "Read up-to-date news articles, speeches, and press releases here.",
    sortOrder: "date-desc",
  },
  content: [],
  version: "0.1.0",
})

/**
 * Minimal `layout: "database"` blob content. `database.dataSource: { type:
 * "native" }` with empty `headers`/`items` satisfies `SearchableTableSchema`'s
 * Native variant (`packages/components/src/interfaces/internal/SearchableTable.ts`)
 * without needing a real data.gov.sg dataset.
 */
const databasePageBlobContent = (
  summary: string,
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  layout: "database",
  page: {
    contentPageHeader: { summary },
    database: {
      dataSource: { type: "native" },
      headers: [],
      items: [],
    },
  },
  content: [],
  version: "0.1.0",
})

/**
 * A standalone Database-layout page (`layout: "database"`). Same
 * `resourceType: Page` pattern as `seedArticlePage` — Database is a valid
 * `NEW_PAGE_LAYOUT_VALUES` layout, seeded directly rather than via the
 * create-page wizard.
 */
export const seedDatabasePage = async ({
  siteId,
  pageTitle = "E2E Database Page",
}: {
  siteId: number
  pageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb(
        databasePageBlobContent("This is the database page summary"),
      ),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: null,
    blobId: blob.id,
    title: pageTitle,
    permalink: `e2e-database-${suffix}`,
  })
  return { page }
}

/** Default `content` for a Folder's IndexPage — a single `childrenpages`
 * block, matching `createFolderIndexPage` in `page.service.ts`. */
const DEFAULT_FOLDER_INDEX_PAGE_CONTENT: UnwrapTagged<PrismaJson.BlobJsonContent>["content"] =
  [
    {
      type: "childrenpages",
      variant: "rows",
      showSummary: true,
      showThumbnail: false,
      childrenPagesOrdering: [],
    },
  ]

/**
 * Same shape as `createFolderIndexPage` in `page.service.ts` — layout
 * `"index"`, but seeded directly rather than via the `page.createIndexPage`
 * mutation (which the dashboard's `IndexpageRow` triggers automatically the
 * first time a folder is visited). `content` defaults to the same
 * `childrenpages` block `createFolderIndexPage` seeds; pass `content: []` for
 * an Index page with no pre-existing `childrenpages` block (e.g. to test
 * adding one via the block picker, which disables that option once one
 * already exists — see `ComponentSelector.tsx`'s `isDisabled` check).
 */
const folderIndexPageBlobContent = (
  title: string,
  content: UnwrapTagged<PrismaJson.BlobJsonContent>["content"] = DEFAULT_FOLDER_INDEX_PAGE_CONTENT,
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  layout: "index",
  page: {
    title,
    contentPageHeader: { summary: `Pages in ${title}` },
  },
  content,
  version: "0.1.0",
})

/** A Folder's IndexPage — folders don't get one automatically on creation
 * (unlike Collections, which always need one — see `seedCollectionIndexPage`
 * above); the dashboard normally auto-creates it on first visit via
 * `trpc.page.createIndexPage`. Seeded directly here instead. */
export const seedFolderIndexPage = async ({
  siteId,
  folderTitle = "E2E Seed Folder",
  content,
}: {
  siteId: number
  folderTitle?: string
  content?: UnwrapTagged<PrismaJson.BlobJsonContent>["content"]
}) => {
  const { folder } = await seedFolder({ siteId, folderTitle })

  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb(folderIndexPageBlobContent(folderTitle, content)),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      title: folderTitle,
      permalink: INDEX_PAGE_PERMALINK,
      siteId,
      parentId: folder.id,
      draftBlobId: blob.id,
      type: ResourceType.IndexPage,
      state: ResourceState.Draft,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { folder, indexPage }
}

/**
 * Same shape as the default `layout: "content"` blob (`setupBlob()` in
 * `tests/integration/helpers/seed/index.ts`) — a `contentPageHeader.summary`
 * plus a `prose` block — but attached to an `IndexPage` resource instead of a
 * plain `Page`. This is the legacy, pre-migration shape a Folder's IndexPage
 * could be left in (migrated from GitHub, or never converted): `type ===
 * IndexPage` but `layout` is still `"content"` rather than `"index"`.
 * `RootStateDrawer.tsx`'s `isCustomContentIndexPage` condition (`type ===
 * ResourceType.IndexPage && layout !== "index" && layout !== "collection"`)
 * detects exactly this state and offers to convert it.
 */
const legacyContentIndexPageBlobContent = (
  summary: string,
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  layout: "content",
  page: {
    contentPageHeader: { summary },
  },
  content: [
    {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ text: SEEDED_PROSE_BLOCK_LABEL, type: "text" }],
        },
      ],
    },
  ],
  version: "0.1.0",
})

/** A Folder's IndexPage stuck on the legacy `layout: "content"` shape —
 * distinct from `seedFolderIndexPage` above, which seeds the already-migrated
 * `layout: "index"` shape. Use this to test the custom-content Index Page
 * conversion flow (`RootStateDrawer.tsx`'s "Preview what this looks like" /
 * "Accept this change" / "Keep old version" UI). */
export const seedFolderLegacyContentIndexPage = async ({
  siteId,
  folderTitle = "E2E Legacy Index Folder",
  summary = "This is some legacy custom content on the index page",
}: {
  siteId: number
  folderTitle?: string
  summary?: string
}) => {
  const { folder } = await seedFolder({ siteId, folderTitle })

  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(legacyContentIndexPageBlobContent(summary)) })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      title: folderTitle,
      permalink: INDEX_PAGE_PERMALINK,
      siteId,
      parentId: folder.id,
      draftBlobId: blob.id,
      type: ResourceType.IndexPage,
      state: ResourceState.Draft,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { folder, indexPage }
}

/**
 * Points the site's existing RootPage (created by `provisionE2ESite`) at a
 * `layout: "homepage"` blob whose first content block is a `hero` — the
 * combination `RootStateDrawer`'s `getIsHeroFirstBlock` checks for before
 * rendering the homepage-only "Hero banner" fixed block. A site only ever has
 * one RootPage, so this mutates the existing draft rather than creating a new
 * resource (matches `seedHomepageHero`'s single caller expecting no cleanup).
 */
export const seedHomepageHero = async ({
  siteId,
  heroTitle = "E2E Homepage Hero",
  variant = "searchbar",
  subtitle,
  backgroundUrl,
}: {
  siteId: number
  heroTitle?: string
  variant?: "searchbar" | "gradient" | "block" | "largeImage" | "floating"
  subtitle?: string
  backgroundUrl?: string
}) => {
  const rootPage = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("type", "=", ResourceType.RootPage)
    .select("id")
    .executeTakeFirstOrThrow()

  const resolvedBackgroundUrl =
    backgroundUrl ??
    (variant === "searchbar" ? undefined : "/placeholder_no_image.png")

  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "homepage",
        page: {},
        content: [
          {
            type: "hero",
            variant,
            title: heroTitle,
            ...(subtitle ? { subtitle } : {}),
            ...(resolvedBackgroundUrl
              ? { backgroundUrl: resolvedBackgroundUrl }
              : {}),
          },
        ],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .set({ draftBlobId: blob.id })
    .where("id", "=", rootPage.id)
    .execute()

  return { rootPageId: rootPage.id }
}

/** setupCollection skips IndexPage. Collection items 404 without it. */
const seedCollectionIndexPage = async ({
  siteId,
  collectionId,
  title,
}: {
  siteId: number
  collectionId: string
  title: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(collectionIndexBlobContent(title)) })
    .returningAll()
    .executeTakeFirstOrThrow()

  return db
    .insertInto("Resource")
    .values({
      title,
      permalink: INDEX_PAGE_PERMALINK,
      siteId,
      parentId: collectionId,
      draftBlobId: blob.id,
      type: ResourceType.IndexPage,
      state: ResourceState.Draft,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const seedFolder = async ({
  siteId,
  folderTitle = "E2E Seed Folder",
}: {
  siteId: number
  folderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await setupFolder({
    siteId,
    title: folderTitle,
    permalink: `e2e-folder-${suffix}`,
  })
  return { folder }
}

export const seedNestedFolder = async ({
  siteId,
  parentFolderTitle = "E2E Parent Folder",
  childFolderTitle = "E2E Nested Folder",
}: {
  siteId: number
  parentFolderTitle?: string
  childFolderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder: parentFolder } = await seedFolder({
    siteId,
    folderTitle: parentFolderTitle,
  })
  const { folder: childFolder } = await setupFolder({
    siteId,
    title: childFolderTitle,
    permalink: `e2e-nested-folder-${suffix}`,
    parentId: parentFolder.id,
  })
  return { parentFolder, childFolder }
}

export const seedRootPage = async ({
  siteId,
  userId,
  state = ResourceState.Draft,
  pageTitle,
  pagePermalink,
}: {
  siteId: number
  userId?: string
  state?: ResourceState
  pageTitle: string
  pagePermalink?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: null,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-page-${suffix}`,
    state,
    userId,
  })
  return { page }
}

export const seedFolderWithPage = async ({
  siteId,
  userId,
  state = ResourceState.Draft,
  pageTitle = "E2E Seed Page",
  pagePermalink,
  folderTitle = "E2E Seed Folder",
}: {
  siteId: number
  userId?: string
  state?: ResourceState
  pageTitle?: string
  pagePermalink?: string
  folderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await seedFolder({ siteId, folderTitle })
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: folder.id,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-page-${suffix}`,
    state,
    userId,
  })
  return { folder, page }
}

export const seedPagesInFolder = async ({
  siteId,
  folderId,
  count,
  titlePrefix = "E2E Sort Item",
}: {
  siteId: number
  folderId: string
  count: number
  titlePrefix?: string
}) =>
  Promise.all(
    Array.from({ length: count }, (_, i) => {
      const suffix = crypto.randomUUID().slice(0, 8)
      const title = `${titlePrefix} ${String(i + 1).padStart(2, "0")}`
      return setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        parentId: folderId,
        title,
        permalink: `e2e-sort-item-${i + 1}-${suffix}`,
      })
    }),
  )

export const seedPageInFolder = async ({
  siteId,
  folderId,
  pageTitle = "E2E Nested Page",
  pagePermalink,
  updatedAt,
  state = ResourceState.Draft,
  userId,
}: {
  siteId: number
  folderId: string
  pageTitle?: string
  pagePermalink?: string
  updatedAt?: Date
  state?: ResourceState
  userId?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: folderId,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-nested-page-${suffix}`,
    state,
    userId,
  })

  if (!updatedAt) {
    return { page }
  }

  const updatedPage = await db
    .updateTable("Resource")
    .set({ updatedAt })
    .where("id", "=", page.id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return { page: updatedPage }
}

export const seedFolderWithChildPage = async ({
  siteId,
  folderTitle = "E2E Seed Folder",
  pageTitle = "E2E Child Page",
}: {
  siteId: number
  folderTitle?: string
  pageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await seedFolder({ siteId, folderTitle })
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: folder.id,
    title: pageTitle,
    permalink: `e2e-child-page-${suffix}`,
  })
  return { folder, childPage: page }
}

/**
 * `state`/`userId` default to `Draft`/none (existing behaviour). Pass
 * `state: ResourceState.Published` with a real `userId` (e.g.
 * `getE2EUserId(TEST_EMAILS.admin)`) when the caller needs the collection
 * page to actually appear in the sitemap the studio preview iframe reads
 * from — `CollectionBlock` (`packages/components`) renders nothing at all if
 * its collection has zero *published* children, and `getLocalisedSitemap`
 * only ever includes `state: "Published"` resources when listing a
 * collection's children.
 */
export const seedCollectionWithPage = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
  pageTitle = "E2E Collection Page",
  state,
  userId,
}: {
  siteId: number
  collectionTitle?: string
  pageTitle?: string
  state?: ResourceState
  userId?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
    state:
      state === ResourceState.Published
        ? ResourceState.Published
        : ResourceState.Draft,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  const { page } = await setupCollectionPage({
    siteId,
    parentId: collection.id,
    title: pageTitle,
    permalink: `e2e-collection-page-${suffix}`,
    state,
    userId,
  })
  return { collection, collectionPage: page }
}

export const seedTwoCollections = async ({
  siteId,
  sourceCollectionTitle = "E2E Source Collection",
  destCollectionTitle = "E2E Dest Collection",
  collectionPageTitle = "E2E Movable Collection Page",
}: {
  siteId: number
  sourceCollectionTitle?: string
  destCollectionTitle?: string
  collectionPageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection: sourceCollection } = await setupCollection({
    siteId,
    title: sourceCollectionTitle,
    permalink: `e2e-src-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: sourceCollection.id,
    title: sourceCollectionTitle,
  })
  const { collection: destCollection } = await setupCollection({
    siteId,
    title: destCollectionTitle,
    permalink: `e2e-dest-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: destCollection.id,
    title: destCollectionTitle,
  })
  const { page: collectionPage } = await setupCollectionPage({
    siteId,
    parentId: sourceCollection.id,
    title: collectionPageTitle,
    permalink: `e2e-movable-col-page-${suffix}`,
  })
  return { sourceCollection, destCollection, collectionPage }
}

export const seedCollectionWithLink = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
  linkTitle = "E2E Collection Link",
}: {
  siteId: number
  collectionTitle?: string
  linkTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  const { collectionLink } = await setupCollectionLink({
    siteId,
    collectionId: collection.id,
    title: linkTitle,
    permalink: `e2e-collection-link-${suffix}`,
  })
  return { collection, collectionLink }
}

export const seedRootCollection = async ({
  siteId,
  collectionTitle = "E2E Root Collection",
}: {
  siteId: number
  collectionTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-root-collection-${suffix}`,
  })
  return { collection }
}

export const seedCollection = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
}: {
  siteId: number
  collectionTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
  })
  const indexPage = await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  return { collection, indexPage }
}

export const seedCollectionLink = async ({
  siteId,
  collectionId,
  linkTitle = "E2E Collection Link",
}: {
  siteId: number
  collectionId: string
  linkTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collectionLink } = await setupCollectionLink({
    siteId,
    collectionId,
    title: linkTitle,
    permalink: `e2e-collection-link-${suffix}`,
  })
  return { collectionLink }
}
