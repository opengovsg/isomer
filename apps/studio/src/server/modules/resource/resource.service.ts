import type { SelectExpression, SelectQueryBuilder } from "kysely"
import type { UnwrapTagged } from "type-fest"
import type {
  ResourceItemContent,
  ResourceOrderByOption,
} from "~/schemas/resource"
import {
  createChildrenPagesComparator,
  type IsomerSitemap,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import get from "lodash-es/get"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  normalizeRedirectPath,
  normalizeRedirectSource,
} from "~/schemas/redirect"
import {
  getSitemapTree,
  injectTagMappings,
  isCollectionItem,
  overwriteCollectionChildrenForCollectionBlock,
} from "~/utils/sitemap"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"
import { type DB } from "~prisma/generated/generatedTypes"

import type { Logger } from "@isomer/logging"

import type {
  Footer,
  Navbar,
  Redirect,
  Resource,
  SafeKysely,
  Site,
  Transaction,
  User,
} from "../database"
import type { SearchResultResource } from "./resource.types"
import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb, ResourceState, ResourceType, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { getUserById } from "../user/user.service"
import { incrementVersion } from "../version/version.service"
import { type Page } from "./resource.types"
import { tokenizeSearchQuery } from "./resource.utils"

// Specify the default columns to return from the Resource table
export const defaultResourceSelect = [
  "Resource.id",
  "Resource.title",
  "Resource.permalink",
  "Resource.siteId",
  "Resource.parentId",
  "Resource.publishedVersionId",
  "Resource.draftBlobId",
  "Resource.type",
  "Resource.state",
  "Resource.createdAt",
  "Resource.updatedAt",
  "Resource.scheduledAt",
  "Resource.scheduledBy",
] satisfies SelectExpression<DB, "Resource">[]

// Shared by any query listing rows from the `Resource` table (e.g. folder/root
// listings, collection item listings) so they sort identically and paginate
// deterministically. `id` is used as the final tie-breaker
export const applyResourceOrderBy = <O>(
  query: SelectQueryBuilder<DB, "Resource", O>,
  orderBy: ResourceOrderByOption,
): SelectQueryBuilder<DB, "Resource", O> => {
  switch (orderBy) {
    case "title-asc":
      return query
        .orderBy(sql`lower("Resource"."title")`, "asc")
        .orderBy("Resource.id", "asc")
    case "updated-desc":
    default:
      return query
        .orderBy("Resource.updatedAt", "desc")
        .orderBy("Resource.id", "asc")
  }
}

const defaultResourceWithBlobSelect = [
  ...defaultResourceSelect,
  "Blob.content",
  "Blob.updatedAt",
] satisfies SelectExpression<DB, "Resource" | "Blob">[]

const defaultNavbarSelect = [
  "Navbar.id",
  "Navbar.siteId",
  "Navbar.content",
] satisfies SelectExpression<DB, "Navbar">[]

const defaultFooterSelect = [
  "Footer.id",
  "Footer.siteId",
  "Footer.content",
] satisfies SelectExpression<DB, "Footer">[]

export const getSiteResourceById = ({
  siteId,
  resourceId,
  type,
}: {
  siteId: Resource["siteId"]
  resourceId: Resource["id"]
  type?: Resource["type"]
}) => {
  let query = db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.id", "=", resourceId)
    .select(defaultResourceSelect)
  if (type) {
    query = query.where("Resource.type", "=", type)
  }

  return query.executeTakeFirst()
}

// NOTE: Base method for retrieving a resource - no distinction made on whether `blobId` exists
const getById = (
  db: SafeKysely,
  { resourceId, siteId }: { resourceId: number; siteId: number },
) =>
  db
    .selectFrom("Resource")
    .where("Resource.id", "=", String(resourceId))
    .where("siteId", "=", siteId)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = async (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) => {
  // Check if the resource is a Collection or Folder, and if so, use its IndexPage
  const resource = await getById(db, args)
    .select(["Resource.id", "Resource.type"])
    .executeTakeFirst()

  let targetResourceId = args.resourceId

  if (
    resource?.type === ResourceType.Collection ||
    resource?.type === ResourceType.Folder
  ) {
    const indexPage = await db
      .selectFrom("Resource")
      .where("Resource.parentId", "=", String(args.resourceId))
      .where("Resource.siteId", "=", args.siteId)
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select("Resource.id")
      .executeTakeFirst()

    if (indexPage) {
      targetResourceId = Number(indexPage.id)
    }
  }

  const targetArgs = { ...args, resourceId: targetResourceId }

  // Check if draft blob exists and return that preferentially
  const draftBlob = await getById(db, targetArgs)
    .where("Resource.draftBlobId", "is not", null)
    .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .forUpdate()
    .executeTakeFirst()
  if (draftBlob) {
    return draftBlob
  }

  const publishedBlob = await getById(db, targetArgs)
    .where("Resource.publishedVersionId", "is not", null)
    .innerJoin("Version", "Resource.publishedVersionId", "Version.id")
    .innerJoin("Blob", "Version.blobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .forUpdate()
    .executeTakeFirst()

  return publishedBlob
}

// There are 7 types of pages this get query supports:
// Page, CollectionPage, RootPage, IndexPage, CollectionLink, FolderMeta, CollectionMeta
export const getPageById = (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) => {
  return getById(db, args)
    .where((eb) =>
      eb.or([
        eb("type", "=", ResourceType.Page),
        eb("type", "=", ResourceType.CollectionPage),
        eb("type", "=", ResourceType.RootPage),
        eb("type", "=", ResourceType.IndexPage),
        eb("type", "=", ResourceType.CollectionLink),
        eb("type", "=", ResourceType.FolderMeta),
        eb("type", "=", ResourceType.CollectionMeta),
      ]),
    )
    .select(defaultResourceSelect)
    .executeTakeFirst()
}

export const updatePageById = (
  page: {
    id: number
    siteId: number
    state?: ResourceState
    parentId?: number
  } & Partial<
    Pick<
      Page,
      | "title"
      | "scheduledAt"
      | "scheduledBy"
      | "publishedVersionId"
      | "draftBlobId"
    >
  >,
  dbInstance?: SafeKysely,
) => {
  const dbObj = dbInstance ?? db
  const { id, parentId, ...rest } = page

  return dbObj
    .updateTable("Resource")
    .set({ ...rest, ...(parentId && { parentId: String(parentId) }) })
    .where("siteId", "=", page.siteId)
    .where("id", "=", String(id))
    .returningAll()
    .executeTakeFirst()
}

interface GetBlobProps {
  db: SafeKysely
  resourceId: string
}

export const getBlobOfResource = async ({ db, resourceId }: GetBlobProps) => {
  const { draftBlobId, publishedVersionId } = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "The specified resource could not be found",
        }),
    )

  if (draftBlobId) {
    return (
      db
        .selectFrom("Blob")
        .where("id", "=", draftBlobId)
        .selectAll()
        // NOTE: Guaranteed to exist since this is a foreign key
        .executeTakeFirstOrThrow()
    )
  }

  return db
    .selectFrom("Blob")
    .selectAll()
    .where("Blob.id", "=", (eb) =>
      eb
        .selectFrom("Version")
        .where("id", "=", publishedVersionId)
        .select("blobId"),
    )
    .executeTakeFirstOrThrow()
}

// NOTE: This function gets the published blob preferentially,
// and if it fails to get a published blob (because the resource has never been published),
// it will fall back to the draft blob
export const getPublishedIndexBlobByParentId = async ({
  db,
  resourceId,
}: GetBlobProps) => {
  const { draftBlobId, publishedVersionId } = await db
    .selectFrom("Resource")
    .where("parentId", "=", resourceId)
    .where("type", "=", ResourceType.IndexPage)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "The specified resource could not be found",
        }),
    )

  if (publishedVersionId) {
    return db
      .selectFrom("Blob")
      .selectAll()
      .where("Blob.id", "=", (eb) =>
        eb
          .selectFrom("Version")
          .where("id", "=", publishedVersionId)
          .select("blobId"),
      )
      .executeTakeFirstOrThrow()
  }

  return (
    db
      .selectFrom("Blob")
      .where("id", "=", draftBlobId)
      .selectAll()
      // NOTE: Guaranteed to exist since this is a foreign key
      .executeTakeFirstOrThrow()
  )
}

export const updateBlobById = async (
  tx: Transaction<DB>,
  {
    pageId,
    content,
    siteId,
  }: {
    pageId: number
    content: UnwrapTagged<PrismaJson.BlobJsonContent>
    siteId: number
  },
) => {
  const page = await tx
    .selectFrom("Resource")
    .where("Resource.id", "=", String(pageId))
    .where("siteId", "=", siteId)
    // NOTE: We update the draft first
    // Main should only be updated at build
    .select("draftBlobId")
    .executeTakeFirst()

  if (!page) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" })
  }

  let blobIdToUpdate = page.draftBlobId

  if (!page.draftBlobId) {
    // NOTE: no draft for this yet, need to create a new one
    const newBlob = await tx
      .insertInto("Blob")
      .values({ content: jsonb(content) })
      .returning("id")
      .executeTakeFirstOrThrow()
    blobIdToUpdate = newBlob.id
    await tx
      .updateTable("Resource")
      .where("id", "=", String(pageId))
      .set({ draftBlobId: newBlob.id })
      .execute()
  }

  return (
    tx
      .updateTable("Blob")
      // NOTE: This works because a page has a 1-1 relation with a blob
      .set({ content: jsonb(content) })
      .where("Blob.id", "=", blobIdToUpdate)
      .returningAll()
      .executeTakeFirstOrThrow()
  )
}

// TODO: should be selecting from new table
export const getNavBar = async (db: SafeKysely, siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Navbar")
    .where("siteId", "=", siteId)
    .select(defaultNavbarSelect)
    // NOTE: Throwing here is acceptable because each site should have a navbar
    .executeTakeFirstOrThrow()

  return { ...rest, content }
}

export const getFooter = async (db: SafeKysely, siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Footer")
    .where("siteId", "=", siteId)
    .select(defaultFooterSelect)
    // NOTE: Throwing here is acceptable because each site should have a footer
    .executeTakeFirstOrThrow()

  return { ...rest, content }
}

// Returns a sparse IsomerSitemap object that revolves around the given
// resourceId, which includes:
// - The full path from root to the actual resource
// - The immediate siblings of the resource (if any)
export const getLocalisedSitemap = async (
  siteId: number,
  resourceId: number,
) => {
  const headerSql = sql<string>`
    CASE
      WHEN (published.content ->> 'layout') IN ('index','content')
      THEN (published.content -> 'page' -> 'contentPageHeader' ->> 'summary')
      WHEN (published.content ->> 'layout') = 'collection'
      THEN (published.content -> 'page' ->> 'subtitle')
      ELSE (published.content -> 'page' -> 'articlePageHeader' ->> 'summary')
    END
`.as("summary")
  const thumbnailSql = sql<string>`
        published.content->'page'->'image'->> 'src'
    `.as("thumbnail")
  const categorySql = sql<string>`
    CASE
      WHEN (published.content ->> 'layout') IN ('article','link')
      THEN (published.content -> 'page' ->> 'category')
      ELSE ''
    END
`.as("category")
  const dateSql = sql<string>`
    CASE
      WHEN (published.content ->> 'layout') IN ('article','link')
      THEN (published.content -> 'page' ->> 'date')
      ELSE ''
    END
`.as("date")
  const contentSql = sql<string>`
    CASE
      WHEN (published.content ->> 'layout') IN ('article','link')
      THEN published.content ->> 'content'
      ELSE ''
    END
`.as("content")
  const categoryIdSql = sql<string | null>`
    CASE
      WHEN (published.content ->> 'layout') IN ('article','link')
      THEN (published.content -> 'page' ->> 'categoryId')
      ELSE NULL
    END
`.as("categoryId")
  const taggedSql = sql<string | null>`
    CASE
      WHEN (published.content ->> 'layout') IN ('article','link')
      THEN (published.content -> 'page' ->> 'tagged')
      ELSE NULL
    END
`.as("tagged")

  // Get the actual resource first
  const resource = await getById(db, { resourceId, siteId })
    .select(defaultResourceSelect)
    .executeTakeFirstOrThrow()

  const allResources = await db
    // Step 1: Get all the ancestors of the resource
    .withRecursive("ancestors", (eb) =>
      eb
        // Base case: Get the actual resource
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "=", String(resourceId))
        .leftJoin("Version", "Version.id", "publishedVersionId")
        .leftJoin("Blob as published", "Version.blobId", "published.id")
        .select(() => [
          headerSql,
          thumbnailSql,
          categorySql,
          dateSql,
          contentSql,
          categoryIdSql,
          taggedSql,
          ...defaultResourceSelect,
        ])
        .unionAll((fb) =>
          fb
            // Recursive case: Get all the ancestors of the resource
            .selectFrom("Resource")
            .where("Resource.siteId", "=", siteId)
            .where("Resource.type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
            ])
            .innerJoin("ancestors", "ancestors.parentId", "Resource.id")
            .select(({ eb }) => [
              eb.cast<string>(eb.val(""), "text").as("summary"),
              eb.cast<string>(eb.val(""), "text").as("thumbnail"),
              eb.cast<string>(eb.val(""), "text").as("category"),
              eb.cast<string>(eb.val(""), "text").as("date"),
              eb.cast<string>(eb.val(""), "text").as("content"),
              eb.cast<string | null>(eb.val(null), "text").as("categoryId"),
              eb.cast<string | null>(eb.val(null), "text").as("tagged"),
              ...defaultResourceSelect,
            ]),
        ),
    )
    // Step 2: Get the immediate siblings of the resource
    .with("immediateSiblings", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "!=", String(resourceId))
        .where((fb) => {
          if (resource.parentId === null) {
            return fb("Resource.parentId", "is", null)
          }
          return fb("Resource.parentId", "=", String(resource.parentId))
        })
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.type", "!=", ResourceType.CollectionMeta)
        .where("state", "=", "Published")
        .leftJoin("Version", "Version.id", "publishedVersionId")
        .leftJoin("Blob as published", "Version.blobId", "published.id")
        .select(() => [
          headerSql,
          thumbnailSql,
          categorySql,
          dateSql,
          contentSql,
          categoryIdSql,
          taggedSql,
          ...defaultResourceSelect,
        ]),
    )
    // Step 3: Get all nested folders and collections
    .withRecursive("nestedResources", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "in", [
          ResourceType.Folder,
          ResourceType.Collection,
          ResourceType.IndexPage,
        ])
        .where("Resource.state", "=", ResourceState.Published)
        .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
        .leftJoin("Blob as published", "Version.blobId", "published.id")
        .select(({ eb }) => [
          headerSql,
          thumbnailSql,
          categorySql,
          dateSql,
          contentSql,
          eb.cast<string | null>(eb.val(null), "text").as("categoryId"),
          eb.cast<string | null>(eb.val(null), "text").as("tagged"),
          ...defaultResourceSelect,
        ])
        .unionAll((fb) =>
          fb
            .selectFrom("Resource")
            .innerJoin(
              "nestedResources",
              "nestedResources.id",
              "Resource.parentId",
            )
            .where("Resource.siteId", "=", Number(siteId))
            .where("Resource.type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
              ResourceType.IndexPage,
            ])
            .where("Resource.state", "=", ResourceState.Published)
            .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
            .leftJoin("Blob as published", "Version.blobId", "published.id")
            .select(({ eb }) => [
              headerSql,
              thumbnailSql,
              categorySql,
              dateSql,
              contentSql,
              eb.cast<string | null>(eb.val(null), "text").as("categoryId"),
              eb.cast<string | null>(eb.val(null), "text").as("tagged"),
              ...defaultResourceSelect,
            ]),
        ),
    )
    // Step 4: Combine all the resources in a single array
    .selectFrom("ancestors as Resource")
    .select([
      "summary",
      "thumbnail",
      "category",
      "date",
      "content",
      "categoryId",
      "tagged",
      ...defaultResourceSelect,
    ])
    .union((eb) =>
      eb
        .selectFrom("immediateSiblings as Resource")
        .select([
          "summary",
          "thumbnail",
          "category",
          "date",
          "content",
          "categoryId",
          "tagged",
          ...defaultResourceSelect,
        ]),
    )
    .union((eb) =>
      eb
        .selectFrom("nestedResources as Resource")
        .select([
          "summary",
          "thumbnail",
          "category",
          "date",
          "content",
          "categoryId",
          "tagged",
          ...defaultResourceSelect,
        ]),
    )
    .orderBy("title asc")
    .execute()

  // Step 5: Construct the localised sitemap object
  const rootResource = await db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.type", "=", ResourceType.RootPage)
    .select(defaultResourceSelect)
    .executeTakeFirst()

  if (rootResource === undefined) {
    // This case will never happen, because we have guaranteed that there is
    // always the root resource
    throw new Error("Root item not found")
  }

  const sitemapTree = getSitemapTree(rootResource, allResources)

  // We do this because collectionblock renders based on the children of the collection
  // and we want to overwrite what's being shown on studio
  // Assumption: Collection Block is only being used on the root page
  if (resource.type === ResourceType.RootPage) {
    return overwriteCollectionChildrenForCollectionBlock(sitemapTree)
  }

  // NOTE: If the resource is part of a collection,
  // we need to inject tag mappings for the preview
  if (isCollectionItem(resource)) {
    return injectTagMappings(sitemapTree, resource)
  }

  // NOTE: Need to override ordering for this resource
  if (resource.type === ResourceType.Page && !!resource.parentId) {
    return updateOrderingForResource(sitemapTree, resource.parentId)
  }

  return sitemapTree
}

const updateOrderingForResource = async (
  sitemap: IsomerSitemap,
  parentId: string,
) => {
  // NOTE: First, try to find the published index blob of the parent
  let indexBlob = undefined

  // NOTE: early return if no index blob
  // as that means that there is no ordering defined
  try {
    indexBlob = await getPublishedIndexBlobByParentId({
      db,
      resourceId: parentId,
    })
  } catch {
    return sitemap
  }

  // NOTE: Next, get the content and see if we have defined a `childrenPagesOrdering`
  const childrenPages = indexBlob.content.content.find(({ type }) => {
    return type === "childrenpages"
  })
  // No need to do anything
  // NOTE: Need to narrow type for inference hence the duplicate check on `type`
  if (!childrenPages || childrenPages.type !== "childrenpages") {
    return sitemap
  }

  const comparator = createChildrenPagesComparator(
    childrenPages.childrenPagesOrdering ?? [],
  )

  return _updateOrderingForResource(sitemap, parentId, comparator)
}

const _updateOrderingForResource = (
  sitemap: IsomerSitemap,
  parentId: string,
  comparator: (a: IsomerSitemap, b: IsomerSitemap) => number,
): IsomerSitemap => {
  if (sitemap.id === parentId) {
    return {
      ...sitemap,
      children: sitemap.children?.toSorted(comparator),
    }
  }

  return {
    ...sitemap,
    children: sitemap.children?.map((child) =>
      _updateOrderingForResource(child, parentId, comparator),
    ),
  }
}

// Accepts an optional `trx` so callers inside a transaction (e.g. the publish
// shadow-redirect guard) read the permalink within the same tx, instead of
// racing a concurrent move that commits between reads. Opens its own
// transaction only when called standalone.
export const getResourcePermalinkTree = async (
  siteId: number,
  resourceId: number,
  trx?: SafeKysely,
): Promise<string[]> => {
  const run = async (tx: SafeKysely) => {
    // Guard against invalid resource
    const resource = await getById(tx, {
      siteId,
      resourceId,
    }).executeTakeFirst()

    if (!resource) {
      return []
    }

    const resourcePermalinks = await tx
      .withRecursive("Ancestors", (eb) =>
        eb
          // Base case: Get the actual resource
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.id", "=", String(resourceId))
          .select(defaultResourceSelect)
          .unionAll((fb) =>
            fb
              // Recursive case: Get all the ancestors of the resource
              .selectFrom("Resource")
              .where("Resource.siteId", "=", siteId)
              .innerJoin("Ancestors", "Ancestors.parentId", "Resource.id")
              .select(defaultResourceSelect),
          ),
      )
      .selectFrom("Ancestors")
      .select("Ancestors.permalink")
      .execute()

    return resourcePermalinks
      .map((r) => r.permalink)
      .reverse()
      .filter((v) => v !== INDEX_PAGE_PERMALINK)
  }

  return trx ? run(trx) : db.transaction().execute(run)
}

export const getResourceFullPermalink = async (
  siteId: number,
  resourceId: number,
  trx?: SafeKysely,
) => {
  const permalinkTree = await getResourcePermalinkTree(siteId, resourceId, trx)
  if (permalinkTree.length === 0) {
    return null
  }
  return `/${permalinkTree.join("/")}`
}

// Returns the id of `resourceId` plus every descendant in its subtree — the
// rows a cascading delete (Resource.parentId is onDelete: Cascade) removes.
// Accepts a tx so the delete path and the count path resolve the same set.
export const getDescendantResourceIds = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<string[]> => {
  const rows = await trx
    .withRecursive("subtree", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "=", resourceId)
        .select("Resource.id")
        // `union` (not `unionAll`) dedupes rows so a malformed parent chain with
        // a cycle can't drive the recursion forever.
        .union((fb) =>
          fb
            .selectFrom("Resource")
            .innerJoin("subtree", "subtree.id", "Resource.parentId")
            .where("Resource.siteId", "=", siteId)
            .select("Resource.id"),
        ),
    )
    .selectFrom("subtree")
    .select("id")
    .execute()
  return rows.map((row) => String(row.id))
}

// Resolves a full permalink path (e.g. "/foo/bar") to the resource that serves
// it, walking permalink segments from the site's root page. A Folder/Collection
// is resolved to its IndexPage child, since that is what actually renders at the
// container's URL (mirroring getFullPageById). Returns undefined when no
// resource exists at the path. Best-effort: intended for non-blocking
// validation (e.g. checking a redirect destination), not access control.
export const getResourceByFullPermalink = async ({
  siteId,
  fullPermalink,
}: {
  siteId: number
  fullPermalink: string
}) => {
  // A redirect destination may keep a literal "?query"/"#fragment" suffix, which
  // isn't part of the resource path — strip it before walking segments so
  // "/page#section" still resolves to the "/page" resource.
  const segments = (fullPermalink.split(/[?#]/)[0] ?? "")
    .split("/")
    .filter(Boolean)

  // The site root ("/") is the RootPage, whose permalink is empty so it has no
  // path segments to walk. Resolve it directly.
  if (segments.length === 0) {
    return db
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.type", "=", ResourceType.RootPage)
      .where("Resource.parentId", "is", null)
      .select(defaultResourceSelect)
      .executeTakeFirst()
  }

  // Fetch every resource whose permalink matches a segment, then walk the
  // (parentId, permalink) chain in memory. Top-level resources have
  // parentId = null (they are NOT stored as children of the RootPage's id), so
  // the walk starts from null — matching getResourceIdByPermalink. Walking from
  // the root page's id instead silently misses every top-level resource. Meta
  // and index resources are never addressable by a path segment; the index page
  // is reached via its parent container below.
  const candidates = await db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.permalink", "in", segments)
    .where("Resource.type", "not in", [
      ResourceType.IndexPage,
      ResourceType.FolderMeta,
      ResourceType.CollectionMeta,
    ])
    .select(defaultResourceSelect)
    .execute()

  let parentId: string | null = null
  let current: (typeof candidates)[number] | undefined
  for (const segment of segments) {
    current = candidates.find(
      (candidate) =>
        candidate.permalink === segment && candidate.parentId === parentId,
    )
    if (!current) {
      return undefined
    }
    parentId = String(current.id)
  }
  if (!current) {
    return undefined
  }

  if (
    current.type === ResourceType.Folder ||
    current.type === ResourceType.Collection
  ) {
    const indexPage = await db
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.parentId", "=", current.id)
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select(defaultResourceSelect)
      .executeTakeFirst()
    // A container with no index page has no page rendering at its URL, so fall
    // back to the container itself — its null publishedVersionId then reads as
    // "not published", which is the right signal for a destination warning.
    return indexPage ?? current
  }

  return current
}

// Batched variant of getResourceFullPermalink: resolves many resources' full
// permalinks in a single recursive query instead of one round-trip per id.
// Used to render redirect destinations (stored as `[resource:...]` references)
// without an N+1 over the visible page. A resourceId absent from the returned
// map no longer exists (e.g. the page was deleted).
export const getResourceFullPermalinks = async (
  siteId: number,
  resourceIds: number[],
): Promise<Map<number, string>> => {
  if (resourceIds.length === 0) {
    return new Map()
  }

  // One recursive walk collects every node on the requested ids' ancestor
  // chains. A node's permalink and parentId are intrinsic to its id (not to
  // which chain reached it), so a single id-keyed map lets each requested id
  // walk from itself up to the root.
  const rows = await db
    .withRecursive("PermalinkChain", (eb) =>
      eb
        // Base case: the resources we want permalinks for
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "in", resourceIds.map(String))
        .select(["Resource.id", "Resource.permalink", "Resource.parentId"])
        .unionAll((fb) =>
          fb
            // Recursive case: walk up to each node's parent
            .selectFrom("Resource")
            .innerJoin(
              "PermalinkChain",
              "PermalinkChain.parentId",
              "Resource.id",
            )
            .where("Resource.siteId", "=", siteId)
            .select(["Resource.id", "Resource.permalink", "Resource.parentId"]),
        ),
    )
    .selectFrom("PermalinkChain")
    .select([
      "PermalinkChain.id",
      "PermalinkChain.permalink",
      "PermalinkChain.parentId",
    ])
    .execute()

  const nodeById = new Map<
    string,
    { permalink: string; parentId: string | null }
  >()
  for (const row of rows) {
    nodeById.set(String(row.id), {
      permalink: row.permalink,
      parentId: row.parentId === null ? null : String(row.parentId),
    })
  }

  const result = new Map<number, string>()
  for (const resourceId of resourceIds) {
    const segments: string[] = []
    let currentId: string | null = String(resourceId)
    while (currentId !== null) {
      const node = nodeById.get(currentId)
      if (node === undefined) {
        break
      }
      segments.push(node.permalink)
      currentId = node.parentId
    }
    // A missing id (deleted resource) yields no segments — omit it.
    if (segments.length === 0) {
      continue
    }
    // segments are leaf→root; reverse to root→leaf and drop the `_index`
    // segments (an index page represents its parent folder, not a path).
    const permalink = segments
      .reverse()
      .filter((segment) => segment !== INDEX_PAGE_PERMALINK)
      .join("/")
    result.set(resourceId, `/${permalink}`)
  }
  return result
}

// Reverse of getResourceFullPermalink: resolves a full permalink path back to
// the resource it points at (for storing a redirect destination as a
// [resource:...] reference), or null if no resource matches. Resolves
// regardless of publish state — a reference to a not-yet-published page is
// valid, and the published redirect rules only include it once it goes live, so
// the redirect can be pre-created and starts working on publish. One query
// fetches every resource matching a path segment, then walks the parent chain in
// memory — the (siteId, parentId, permalink) constraint makes each step
// unambiguous.
export const getResourceIdByPermalink = async (
  siteId: number,
  fullPermalink: string,
): Promise<number | null> => {
  const segments = fullPermalink.split("/").filter(Boolean)

  // The site root ("/") is the RootPage, whose permalink is empty so it has no
  // path segments to walk. Resolve it directly.
  if (segments.length === 0) {
    const root = await db
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.type", "=", ResourceType.RootPage)
      .select("Resource.id")
      .executeTakeFirst()
    return root ? Number(root.id) : null
  }

  const candidates = await db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.permalink", "in", segments)
    .select([
      "Resource.id",
      "Resource.permalink",
      "Resource.parentId",
      "Resource.publishedVersionId",
      "Resource.type",
    ])
    .execute()

  let parentId: string | null = null
  let leaf: (typeof candidates)[number] | null = null
  for (const segment of segments) {
    const match = candidates.find(
      (candidate) =>
        candidate.permalink === segment && candidate.parentId === parentId,
    )
    if (!match) {
      return null
    }
    leaf = match
    parentId = String(match.id)
  }

  if (leaf === null) {
    return null
  }

  // A Folder/Collection is served by its IndexPage child, and the published
  // site keys the URL on the container's id (the index page's id never appears
  // there — the build remaps it to the folder). Resolve to the container when it
  // has an index page; publish state doesn't matter here (the build emits the
  // redirect only once that index page is published).
  if (
    leaf.type === ResourceType.Folder ||
    leaf.type === ResourceType.Collection
  ) {
    const indexPage = await db
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.parentId", "=", String(leaf.id))
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select("Resource.id")
      .executeTakeFirst()
    return indexPage ? Number(leaf.id) : null
  }

  return Number(leaf.id)
}

// Batched variant of getResourceIdByPermalink: resolves many full-permalink
// paths to the resource sitting at each path in a single pair of queries rather
// than one walk (and round-trip) per path. Returns each path's leaf resource id
// — a folder/collection resolves to its own id — regardless of publish state; a
// path matching no resource maps to null. Liveness (including whether a
// container has a published index page) is left to the caller's publish-state
// lookup, so this is used to resolve the literal-path redirect destinations on
// the visible page without an N+1.
export const getResourceIdsByPermalinks = async (
  siteId: number,
  fullPermalinks: string[],
): Promise<Map<string, number | null>> => {
  const result = new Map<string, number | null>()
  const uniquePaths = [...new Set(fullPermalinks)]
  if (uniquePaths.length === 0) {
    return result
  }

  const segmentsByPath = new Map(
    uniquePaths.map((path) => [path, path.split("/").filter(Boolean)]),
  )
  const needsRoot = [...segmentsByPath.values()].some(
    (segments) => segments.length === 0,
  )
  const allSegments = [...new Set([...segmentsByPath.values()].flat())]

  // One query for every candidate segment across all paths, plus the root page
  // only when a bare "/" path is present — two round-trips regardless of N.
  const [root, candidates] = await Promise.all([
    needsRoot
      ? db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", ResourceType.RootPage)
          .where("Resource.parentId", "is", null)
          .select("Resource.id")
          .executeTakeFirst()
      : Promise.resolve(undefined),
    allSegments.length > 0
      ? db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.permalink", "in", allSegments)
          .select(["Resource.id", "Resource.permalink", "Resource.parentId"])
          .execute()
      : Promise.resolve([]),
  ])

  // Index candidates by (parentId, permalink) so each segment step is an O(1)
  // lookup. A linear `candidates.find` per segment is O(segments * candidates),
  // which a large bulk upload against a resource-heavy site pushes into hundreds
  // of millions of comparisons — enough to block the event loop. The " "
  // separator is safe: a parentId is only digits, so the concatenation is
  // injective (the first space always delimits parentId from permalink).
  const idByParentAndPermalink = new Map<string, string>()
  for (const candidate of candidates) {
    const key = `${candidate.parentId ?? ""} ${candidate.permalink}`
    // Keep the first match, mirroring the previous `Array.find` semantics.
    if (!idByParentAndPermalink.has(key)) {
      idByParentAndPermalink.set(key, String(candidate.id))
    }
  }

  for (const [path, segments] of segmentsByPath) {
    if (segments.length === 0) {
      result.set(path, root ? Number(root.id) : null)
      continue
    }
    // Walk the (parentId, permalink) chain in memory — the same unambiguous
    // step the singular helper makes, resolved against the shared candidate set.
    let parentId: string | null = null
    let leafId: number | null = null
    let resolved = true
    for (const segment of segments) {
      const matchId = idByParentAndPermalink.get(`${parentId ?? ""} ${segment}`)
      if (matchId === undefined) {
        resolved = false
        break
      }
      leafId = Number(matchId)
      parentId = matchId
    }
    result.set(path, resolved ? leafId : null)
  }
  return result
}

interface PublishPageResourceArgs {
  logger: Logger<string>
  userId: string
  siteId: number
  resourceId: string
  sitePublish?: {
    enableCodebuildJobs: boolean
    isScheduled: boolean
  }
  isSingpassEnabled?: boolean
}

export const publishPageResource = async ({
  logger,
  siteId,
  resourceId,
  userId,
  sitePublish,
}: PublishPageResourceArgs) => {
  await db.transaction().execute(async (tx) => {
    // Step 1: Create a new version
    const fullResource = await getFullPageById(tx, {
      resourceId: Number(resourceId),
      siteId,
    })

    if (!fullResource) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Please ensure you are attempting to publish a page that exists",
      })
    }

    // Only the first publish needs the redirect handling below: the shadow
    // guard (re-publishing an already-live page is fine) and the reference
    // back-fill (a page that has published before was already back-filled). The
    // full permalink drives both, so compute it once here.
    const isFirstPublish = fullResource.publishedVersionId === null
    const fullPermalink = isFirstPublish
      ? await getResourceFullPermalink(siteId, Number(resourceId), tx)
      : null

    // First-publish guard: taking a page live at a URL a live redirect occupies
    // would let the redirect shadow it. Mirror of the redirect-create
    // SOURCE_IS_EXISTING_PAGE guard. The Redirect table is queried directly to
    // avoid a circular import (redirect.service already depends on this module).
    if (isFirstPublish && fullPermalink) {
      const blockingRedirect = await tx
        .selectFrom("Redirect")
        .select("Redirect.id")
        .where("Redirect.siteId", "=", siteId)
        .where("Redirect.source", "=", normalizeRedirectSource(fullPermalink))
        .where("Redirect.deletedAt", "is", null)
        .executeTakeFirst()
      if (blockingRedirect) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Can't publish — a redirect already exists at ${fullPermalink}. Remove it on the Redirections page first.`,
        })
      }
    }

    const version = await incrementVersion({ tx, siteId, resourceId, userId })

    if (!version) {
      logger.warn(
        `No draft found for resource ${resourceId} in site ${siteId}. Publish aborted.`,
      )
      return
    }

    // Reference back-fill: a redirect created to this resource's URL before it
    // existed (or was published) is stored as a literal path — so it works once
    // the URL is live but does NOT follow future moves. Now that the URL is
    // live, rewrite those literal destinations into a [resource:...] reference
    // so they track the resource from here on. An IndexPage renders at its
    // container's URL, and creation stores the container id for that path, so
    // reference the container (parent) id rather than the index page's own id.
    if (isFirstPublish && fullPermalink) {
      const referenceId =
        fullResource.type === ResourceType.IndexPage
          ? fullResource.parentId
          : resourceId
      if (referenceId) {
        const literalDestination = normalizeRedirectPath(fullPermalink)
        const backfilled = await tx
          .updateTable("Redirect")
          .set({ destination: `[resource:${siteId}:${referenceId}]` })
          .where("siteId", "=", siteId)
          .where("destination", "=", literalDestination)
          .where("deletedAt", "is", null)
          .returningAll()
          .execute()

        // Audit the rewrite as a delete of the literal redirect followed by a
        // create of the reference one — the destination change isn't otherwise
        // captured, and there's no dedicated RedirectUpdate event.
        if (backfilled.length > 0) {
          const byUser = await getUserById(userId)
          for (const rewritten of backfilled) {
            const literalBefore: Redirect = {
              ...rewritten,
              destination: literalDestination,
              deletedAt: null,
            }
            const literalAfter: Redirect = {
              ...rewritten,
              destination: literalDestination,
              deletedAt: new Date(),
            }
            await logRedirectEvent(tx, {
              siteId,
              by: byUser,
              eventType: AuditLogEvent.RedirectDelete,
              delta: { before: literalBefore, after: literalAfter },
            })
            await logRedirectEvent(tx, {
              siteId,
              by: byUser,
              eventType: AuditLogEvent.RedirectCreate,
              delta: { before: null, after: rewritten },
            })
          }
        }
      }
    }

    const { previousVersion, newVersion } = version

    await logPublishEvent(tx, {
      siteId,
      by: await getUserById(userId),
      delta: {
        before: previousVersion ? { versionId: previousVersion.id } : null,
        after: { versionId: newVersion.id },
      },
      eventType: AuditLogEvent.Publish,
      metadata: fullResource,
    })
  })

  // Step 2: Trigger a publish of the site
  if (sitePublish)
    await publishSite(logger, {
      siteId,
      codebuildJob: sitePublish.enableCodebuildJobs
        ? {
            resourceWithUserIds: [{ resourceId, userId }],
            isScheduled: sitePublish.isScheduled,
          }
        : undefined,
    })
}

/**
 * NOTE: The distinction here between `publishResource` and `publishPageResource` is that
 * this should be used for publishes that do not incur a change to `Blob.content`
 * and hence, don't incur a log to the `Version` table
 * @param by The user who is publishing the resource
 * @param resource Resource to be published
 * @param logger Logger instance
 * @returns
 */
export const publishResource = async (
  by: User["id"],
  resource: Resource,
  logger: Logger<string>,
) => {
  const byUser = await db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", by)
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are logged in!",
        }),
    )

  return db.transaction().execute(async (tx) => {
    await logPublishEvent(tx, {
      siteId: resource.siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: resource,
    })

    await publishSite(logger, { siteId: resource.siteId })
  })
}

export const publishSiteConfig = async (
  by: string,
  {
    site,
    ...rest
  }: { site: Site } | { site: Site; footer: Footer; navbar: Navbar },
  logger: Logger<string>,
) => {
  const byUser = await db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", by)
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are logged in!",
        }),
    )

  return db.transaction().execute(async (tx) => {
    await logPublishEvent(tx, {
      siteId: site.id,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { site, ...rest },
    })

    await publishSite(logger, { siteId: site.id })
  })
}

export const getBatchAncestryWithSelfQuery = async ({
  siteId,
  resourceIds,
}: {
  siteId: number
  resourceIds: string[]
}): Promise<ResourceItemContent[][]> => {
  const resourceObject = sql<ResourceItemContent>`jsonb_build_object(
    'title', "Resource"."title",
    'permalink', "Resource"."permalink",
    'type', "Resource"."type",
    'id', "Resource"."id"::text,
    'parentId', "Resource"."parentId"::text
  )`

  const result = await db
    .withRecursive("recursiveResources", (eb) =>
      eb
        .selectFrom("Resource")
        .select([
          "Resource.id",
          "Resource.parentId",
          sql<ResourceItemContent[]>`jsonb_build_array(${resourceObject})`.as(
            "groupedByPath",
          ),
        ])
        .where("Resource.siteId", "=", Number(siteId))
        .where("Resource.id", "in", resourceIds)
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.IndexPage)
        .unionAll(
          eb
            .selectFrom("Resource")
            .innerJoin(
              "recursiveResources",
              "recursiveResources.parentId",
              "Resource.id",
            )
            .select([
              "Resource.id",
              "Resource.parentId",
              sql<
                ResourceItemContent[]
              >`jsonb_build_array(${resourceObject}) || "recursiveResources"."groupedByPath"`.as(
                "groupedByPath",
              ),
            ]),
        ),
    )
    .selectFrom("recursiveResources")
    .select("recursiveResources.groupedByPath")
    .where("recursiveResources.parentId", "is", null)
    .execute()

  return result.map((r) => r.groupedByPath)
}

export const getWithFullPermalink = async ({
  resourceIds,
  siteId,
}: {
  resourceIds: string[]
  siteId: number
}) => {
  if (resourceIds.length === 0) {
    return []
  }

  const result = await db
    .withRecursive("resourcePath", (eb) =>
      eb
        .selectFrom("Resource as r")
        .select([
          "r.id",
          "r.title",
          "r.permalink",
          "r.parentId",
          "r.permalink as fullPermalink",
        ])
        .where("r.siteId", "=", siteId)
        .where("r.parentId", "is", null)
        .unionAll(
          eb
            .selectFrom("Resource as s")
            .innerJoin("resourcePath as rp", "s.parentId", "rp.id")
            .where("s.siteId", "=", siteId)
            .select([
              "s.id",
              "s.title",
              "s.permalink",
              "s.parentId",
              sql<string>`CONCAT(rp."fullPermalink", '/', s.permalink)`.as(
                "fullPermalink",
              ),
            ]),
        ),
    )
    .selectFrom("resourcePath as rp")
    .select(["rp.id", "rp.title", "rp.fullPermalink"])
    .where("rp.id", "in", resourceIds)
    .execute()

  return result
}

const getResourcesWithLastUpdatedAt = ({ siteId }: { siteId: number }) => {
  return db
    .selectFrom("Resource")
    .select([
      "Resource.id",
      "Resource.title",
      "Resource.type",
      "Resource.parentId",
      // To handle cases where either the resource or the blob is updated
      sql<Date | null>`GREATEST("Resource"."updatedAt", "Blob"."updatedAt")`.as(
        "lastUpdatedAt",
      ),
    ])
    .leftJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .where("Resource.siteId", "=", siteId)
}

const getResourcesWithFullPermalink = async ({
  resources,
  siteId,
}: {
  resources: Omit<SearchResultResource, "fullPermalink">[]
  siteId: number
}): Promise<SearchResultResource[]> => {
  const result = await getWithFullPermalink({
    resourceIds: resources.map((resource) => resource.id),
    siteId,
  })

  return resources.map((resource) => ({
    ...resource,
    fullPermalink:
      result.find((r) => r.id === resource.id)?.fullPermalink ?? "",
  }))
}

export const getSearchResults = async ({
  siteId,
  query,
  offset,
  limit,
  resourceTypes,
}: {
  siteId: number
  query: string
  offset: number
  limit: number
  resourceTypes: ResourceType[]
}): Promise<{
  totalCount: number | null
  resources: SearchResultResource[]
}> => {
  // An empty `in` list is invalid SQL, so guard like getWithFullPermalink.
  if (resourceTypes.length === 0) {
    return { resources: [], totalCount: 0 }
  }

  const searchTerms = tokenizeSearchQuery(query)

  const queriedResources = getResourcesWithLastUpdatedAt({
    siteId: Number(siteId),
  })
    .where("Resource.type", "in", resourceTypes)
    .where((eb) =>
      eb.and(
        searchTerms.map((searchTerm) =>
          // Match if the search term is at the start of the title
          eb("Resource.title", "ilike", `${searchTerm}%`).or(
            // Match if the search term is in the middle of the title (after a space)
            eb("Resource.title", "ilike", `% ${searchTerm}%`),
          ),
        ),
      ),
    )

  // Currently ordered by number of words matched
  // followed by `lastUpdatedAt` if there's a tie-break
  let orderedResources = queriedResources
  if (searchTerms.length > 1) {
    orderedResources = orderedResources.orderBy(
      sql`(
        ${sql.join(
          searchTerms.map(
            (searchTerm) =>
              // 1. Match if the search term is at the start of the title
              // 2. Match if the search term is in the middle of the title (after a space)
              sql`
                CASE
                  WHEN (
                    "Resource"."title" ILIKE ${searchTerm + "%"} OR
                    "Resource"."title" ILIKE ${"% " + searchTerm + "%"}
                  )
                  THEN ${searchTerm.length}
                  ELSE 0
                END
              `,
          ),
          sql` + `,
        )}
      ) DESC`,
    )
  }
  orderedResources = orderedResources.orderBy("lastUpdatedAt", "desc")

  const [resourcesToReturn, totalCountResult] = await Promise.all([
    orderedResources.offset(offset).limit(limit).execute(),
    db
      .with("queriedResources", () => queriedResources)
      .selectFrom("queriedResources")
      .select(db.fn.countAll<number>().as("total_count")) // needed to cast as the type can be `bigint`
      .executeTakeFirstOrThrow(),
  ])

  return {
    resources: await getResourcesWithFullPermalink({
      resources: resourcesToReturn,
      siteId: Number(siteId),
    }),
    totalCount: totalCountResult.total_count,
  }
}

export const getSearchRecentlyEdited = async ({
  siteId,
  limit = 5, // Hardcoded for now to be 5
}: {
  siteId: number
  limit?: number
}): Promise<SearchResultResource[]> => {
  return await getResourcesWithFullPermalink({
    siteId: Number(siteId),
    resources: await getResourcesWithLastUpdatedAt({ siteId: Number(siteId) })
      .where("Resource.type", "in", [
        // only show page-ish resources
        ResourceType.Page,
        ResourceType.CollectionLink,
        ResourceType.CollectionPage,
      ])
      .limit(limit)
      .orderBy("lastUpdatedAt", "desc")
      .execute(),
  })
}

export const getSearchWithResourceIds = async ({
  siteId,
  resourceIds,
}: {
  siteId: number
  resourceIds: string[]
}): Promise<SearchResultResource[]> => {
  const resources = await db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", Number(siteId))
    .where("Resource.id", "in", resourceIds)
    .select([
      "Resource.id",
      "Resource.type",
      "Resource.title",
      "Resource.parentId",
    ])
    .execute()

  return await getResourcesWithFullPermalink({
    siteId: Number(siteId),
    resources: resources.map((resource) => ({
      ...resource,
      lastUpdatedAt: null,
    })),
  })
}

interface CreatePageWithBlobProps {
  db: SafeKysely
  title: string
  permalink: string
  siteId: number
  parentId: string | null
  blobContent: UnwrapTagged<PrismaJson.BlobJsonContent>
  type: keyof typeof ResourceType
}

export const createResourceWithBlob = async ({
  db,
  title,
  permalink,
  siteId,
  parentId,
  blobContent,
  type,
}: CreatePageWithBlobProps) => {
  // Validate whether parent is a folder/collection
  if (parentId) {
    const parent = await db
      .selectFrom("Resource")
      .where("Resource.id", "=", parentId)
      .where("Resource.siteId", "=", siteId)
      .where("Resource.type", "in", [
        ResourceType.Collection,
        ResourceType.Folder,
      ])
      .select("Resource.id")
      .executeTakeFirst()
    if (!parent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "Parent not found or parentId is not a valid collection or folder",
      })
    }
  }

  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(blobContent) })
    .returningAll()
    .executeTakeFirstOrThrow()

  const resource = await db
    .insertInto("Resource")
    .values({
      title,
      permalink,
      siteId,
      parentId,
      draftBlobId: blob.id,
      type,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .catch((err) => {
      if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        })
      }
      throw err
    })

  return { resource, blob }
}
