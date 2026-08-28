import type {
  ExpressionBuilder,
  SelectExpression,
  SelectQueryBuilder,
} from "kysely"
import type { UnwrapTagged } from "type-fest"
import type {
  ResourceItemContent,
  ResourceOrderByOption,
  ResourceStatusFilterOption,
} from "~/schemas/resource"
import {
  createChildrenPagesComparator,
  type IsomerSitemap,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import chunk from "lodash-es/chunk"
import get from "lodash-es/get"
import { UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS } from "~/constants/resources"
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
import {
  AuditLogEvent,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"
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
import {
  AncestorScheduledUnpublishLockError,
  PageAlreadyUnpublishedError,
  ScheduledActionConflictError,
} from "./resource.error"
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
  "Resource.scheduledAction",
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
    case "permalink-asc":
      // CollectionLink permalinks are random UUIDs and hidden in the CMS, so
      // sort links by title and pages by permalink in one combined list.
      return query
        .orderBy(
          sql`lower(CASE WHEN "Resource"."type" = ${ResourceType.CollectionLink} THEN "Resource"."title" ELSE "Resource"."permalink" END)`,
          "asc",
        )
        .orderBy("Resource.id", "asc")
    case "updated-desc":
    default:
      return query
        .orderBy("Resource.updatedAt", "desc")
        .orderBy("Resource.id", "asc")
  }
}

const CONTAINER_TYPES = [ResourceType.Folder, ResourceType.Collection]

// Folder/Collection ids that count as "live"/"not live" for the status
// filter, derived from the same child-live-status map the Status column
// badges use — see getChildLiveStatusMap. A container is "live" (whether
// fully live or just live-template) iff something in its subtree is
// published; otherwise it's "not live".
export const splitContainerIdsByLiveStatus = (
  childLiveStatus: Map<
    string,
    { hasLiveDescendant: boolean; hasLiveIndexPage: boolean }
  >,
): { liveContainerIds: string[]; notLiveContainerIds: string[] } => {
  const liveContainerIds: string[] = []
  const notLiveContainerIds: string[] = []
  for (const [id, { hasLiveDescendant }] of childLiveStatus) {
    ;(hasLiveDescendant ? liveContainerIds : notLiveContainerIds).push(id)
  }
  return { liveContainerIds, notLiveContainerIds }
}

const matchesContainerIds = (
  eb: ExpressionBuilder<DB, "Resource">,
  ids: string[],
) => (ids.length > 0 ? eb("Resource.id", "in", ids) : sql<boolean>`false`)

// Shared by listWithoutRoot/countWithoutRoot so the Status filter dropdown
// and the "N items" count agree. Tags are OR'd together (a row matches if it
// satisfies any checked tag). Live/notLive need liveContainerIds/
// notLiveContainerIds (from splitContainerIdsByLiveStatus) since a Folder/
// Collection's own publishedVersionId is never set — every other tag reads
// the row's own columns uniformly regardless of type.
export const applyResourceStatusFilter = <O>(
  query: SelectQueryBuilder<DB, "Resource", O>,
  {
    statusFilter,
    liveContainerIds,
    notLiveContainerIds,
  }: {
    statusFilter: ResourceStatusFilterOption[]
    liveContainerIds: string[]
    notLiveContainerIds: string[]
  },
): SelectQueryBuilder<DB, "Resource", O> => {
  if (statusFilter.length === 0) {
    return query
  }

  return query.where((eb) => {
    const isContainer = eb("Resource.type", "in", CONTAINER_TYPES)
    const isLeaf = eb("Resource.type", "not in", CONTAINER_TYPES)

    return eb.or(
      statusFilter.map((tag) => {
        switch (tag) {
          case "live":
            return eb.or([
              eb.and([
                isLeaf,
                eb("Resource.publishedVersionId", "is not", null),
              ]),
              eb.and([isContainer, matchesContainerIds(eb, liveContainerIds)]),
            ])
          case "notLive":
            return eb.or([
              eb.and([isLeaf, eb("Resource.publishedVersionId", "is", null)]),
              eb.and([
                isContainer,
                matchesContainerIds(eb, notLiveContainerIds),
              ]),
            ])
          case "scheduledToPublish":
            return eb.and([
              eb("Resource.scheduledAt", "is not", null),
              eb.or([
                eb("Resource.scheduledAction", "is", null),
                eb("Resource.scheduledAction", "=", ScheduledAction.Publish),
              ]),
            ])
          case "scheduledToUnpublish":
            return eb.and([
              eb("Resource.scheduledAt", "is not", null),
              eb("Resource.scheduledAction", "=", ScheduledAction.Unpublish),
            ])
          case "hasDraft":
            return eb("Resource.draftBlobId", "is not", null)
        }
      }),
    )
  })
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

// Accepts any resourceId and returns the effective page id to operate on.
// A Folder/Collection never carries its own publishedVersionId/draftBlobId —
// its liveness and content are entirely its child IndexPage's — so those are
// resolved to that child's id. Every other resourceId (including a Folder/
// Collection with no IndexPage yet, or an ordinary page) is returned
// unchanged. Shared by every flow that accepts a container id as shorthand
// for "its landing page" — publish/unpublish (via getFullPageById below)
// and scheduling both need this same resolution so their input contract
// matches.
export const resolveEffectiveResourceId = async (
  db: SafeKysely,
  { resourceId, siteId }: { resourceId: number; siteId: number },
): Promise<number> => {
  const resource = await getById(db, { resourceId, siteId })
    .select(["Resource.id", "Resource.type"])
    .executeTakeFirst()

  if (
    resource?.type === ResourceType.Collection ||
    resource?.type === ResourceType.Folder
  ) {
    const indexPage = await db
      .selectFrom("Resource")
      .where("Resource.parentId", "=", String(resourceId))
      .where("Resource.siteId", "=", siteId)
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select("Resource.id")
      .executeTakeFirst()

    if (indexPage) {
      return Number(indexPage.id)
    }
  }

  return resourceId
}

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = async (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) => {
  const targetResourceId = await resolveEffectiveResourceId(db, args)
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
      | "scheduledAction"
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
          // `union` (not `unionAll`) dedupes rows so a malformed parent chain with
          // a cycle can't drive the recursion forever.
          .union((fb) =>
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

// The `subtree` CTE shared by the walks below; callers continue with their own
// `.selectFrom("subtree")`. `union` (not `unionAll`) dedupes rows so a malformed
// parent chain with a cycle can't drive the recursion forever.
const withResourceSubtree = (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
) =>
  trx.withRecursive("subtree", (eb) =>
    eb
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.id", "=", resourceId)
      .select("Resource.id")
      .union((fb) =>
        fb
          .selectFrom("Resource")
          .innerJoin("subtree", "subtree.id", "Resource.parentId")
          .where("Resource.siteId", "=", siteId)
          .select("Resource.id"),
      ),
  )

// Returns the id of `resourceId` plus every descendant in its subtree — the
// rows a cascading delete (Resource.parentId is onDelete: Cascade) removes.
// Accepts a tx so the delete path and the count path resolve the same set.
export const getDescendantResourceIds = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<string[]> => {
  const rows = await withResourceSubtree(trx, { siteId, resourceId })
    .selectFrom("subtree")
    .select("id")
    .execute()
  return rows.map((row) => String(row.id))
}

// Both checks below filter by UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS
// (the same allow-list unpublishPage validates against) rather than denying
// FolderMeta/CollectionMeta by name. Those two are excluded because they're
// ordering metadata that can carry a stray publishedVersionId despite never
// being a real page (see `@deprecated pageOrderFromIndex` in the static-site
// build script); RootPage's exclusion is moot since it's never a descendant.
// Folder/Collection are in the allow-list too but never match here anyway —
// they never carry their own publishedVersionId.

// True when `resourceId` or any descendant is published — the folder analogue of
// a page's `publishedVersionId !== null`, used to decide whether a folder/
// collection move or rename should preserve its old URLs with a redirect (there
// is nothing to preserve for a subtree that was never live). Keys on
// publishedVersionId, not `state`: nothing unpublishes a resource today, so the
// two only ever change together (see version.service.ts).
export const hasPublishedDescendant = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<boolean> => {
  // Fold the published filter into the recursive walk and stop at the first
  // hit — an existence check that never materialises the full subtree id list
  // or issues a second `WHERE id IN (...)` query.
  const published = await withResourceSubtree(trx, { siteId, resourceId })
    .selectFrom("subtree")
    .innerJoin("Resource", "Resource.id", "subtree.id")
    .where("Resource.publishedVersionId", "is not", null)
    .where("Resource.type", "in", UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS)
    .select("Resource.id")
    .executeTakeFirst()
  return published !== undefined
}

// Ids of the published resources strictly within `resourceId`'s subtree (the
// container itself is excluded — its own URL is validated separately). Used to
// check that a folder move/rename doesn't drop a live descendant onto a path an
// existing redirect already covers.
export const getPublishedDescendantResourceIds = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<string[]> => {
  const rows = await withResourceSubtree(trx, { siteId, resourceId })
    .selectFrom("subtree")
    .innerJoin("Resource", "Resource.id", "subtree.id")
    .where("Resource.id", "!=", resourceId)
    .where("Resource.publishedVersionId", "is not", null)
    .where("Resource.type", "in", UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS)
    .select("Resource.id")
    .execute()
  return rows.map((row) => String(row.id))
}

// Ids of descendants that would still be live when a scheduled unpublish of
// `resourceId` (an IndexPage) fires at `scheduledAt` — i.e. this is the
// schedule-time analogue of getPublishedDescendantResourceIds's execution-time
// check. A descendant is "safe" (excluded from the result) only if:
//   - it's currently live AND has its own scheduled Unpublish at or before
//     `scheduledAt` (so it'll be down by the time this one fires — the cron's
//     depth-aware execution ordering, see schedulePublishingJob.ts, is what
//     guarantees an exact-same-instant descendant actually lands first), or
//   - it's currently not live AND has no scheduled Publish before
//     `scheduledAt` (so it won't come back up before this one fires).
// The second case matters even though the descendant isn't live right now:
// without it, a descendant could be sitting on an already-scheduled Publish
// for some time before `scheduledAt`, guaranteeing it'll be live again by
// the time this unpublish executes — a fact fully knowable now, not a race.
// A currently-live descendant with no schedule, or one scheduled for a
// *later* Unpublish, is unsafe; same for a currently-unpublished descendant
// scheduled to Publish before `scheduledAt` (a null scheduledAction is
// treated as Publish, matching the convention elsewhere in this module).
export const getDescendantResourceIdsUnsafeForScheduledUnpublish = async (
  trx: SafeKysely,
  {
    siteId,
    resourceId,
    scheduledAt,
  }: { siteId: number; resourceId: string; scheduledAt: Date },
): Promise<string[]> => {
  const rows = await withResourceSubtree(trx, { siteId, resourceId })
    .selectFrom("subtree")
    .innerJoin("Resource", "Resource.id", "subtree.id")
    .where("Resource.id", "!=", resourceId)
    .where("Resource.type", "in", UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS)
    .where((eb) =>
      eb.or([
        // Unsafe case 1: currently live, and nothing guarantees it'll be
        // down before `scheduledAt` fires.
        eb.and([
          eb("Resource.publishedVersionId", "is not", null),
          eb.or([
            // No unpublish scheduled at all.
            eb("Resource.scheduledAt", "is", null),
            // An unpublish is scheduled, but strictly after `scheduledAt` —
            // not guaranteed to land first. Equal is fine: the cron's
            // depth-aware ordering (schedulePublishingJob.ts) processes a
            // descendant due at the same instant before its ancestor.
            eb("Resource.scheduledAt", ">", scheduledAt),
            // A schedule exists with no action recorded — legacy rows
            // (pre-scheduledAction) default to Publish, so this is not an
            // Unpublish.
            eb("Resource.scheduledAction", "is", null),
            // A schedule exists, but it's a Publish, not an Unpublish.
            eb("Resource.scheduledAction", "!=", ScheduledAction.Unpublish),
          ]),
        ]),
        // Unsafe case 2: not live right now, but scheduled to become live
        // again before `scheduledAt` fires.
        eb.and([
          eb("Resource.publishedVersionId", "is", null),
          // A schedule exists...
          eb("Resource.scheduledAt", "is not", null),
          // ...and it fires strictly before `scheduledAt`...
          eb("Resource.scheduledAt", "<", scheduledAt),
          eb.or([
            // ...and it's a Publish (or defaults to one, per the legacy
            // null-scheduledAction convention above).
            eb("Resource.scheduledAction", "is", null),
            eb("Resource.scheduledAction", "=", ScheduledAction.Publish),
          ]),
        ]),
      ]),
    )
    .select("Resource.id")
    .execute()
  return rows.map((row) => String(row.id))
}

// True when some descendant of `resourceId` (excluding `excludeResourceId`)
// has a pending scheduled Unpublish — a plain existence check, unlike the
// "unsafe for scheduled X" functions above: there's no time cutoff to
// compare against, just "does anything downstream still depend on this
// happening". Used to hard-block cancelling an IndexPage's own scheduled
// unpublish out from under dependents (see cancelScheduleUnpublish in
// page.service.ts) — the caller must cancel the descendants' schedules
// first. `excludeResourceId` is the IndexPage whose own schedule is being
// cancelled: it's still part of `resourceId`'s (its container's) subtree and
// still has `scheduledAt` set at the point this check runs (the cancel
// hasn't been applied yet), so it must be excluded or the check would
// always find "itself" as a blocking dependent.
export const hasDescendantWithPendingScheduledUnpublish = async (
  trx: SafeKysely,
  {
    siteId,
    resourceId,
    excludeResourceId,
  }: {
    siteId: number
    resourceId: string
    excludeResourceId: string
  },
): Promise<boolean> => {
  const row = await withResourceSubtree(trx, { siteId, resourceId })
    .selectFrom("subtree")
    .innerJoin("Resource", "Resource.id", "subtree.id")
    .where("Resource.id", "!=", excludeResourceId)
    .where("Resource.scheduledAt", "is not", null)
    .where("Resource.scheduledAction", "=", ScheduledAction.Unpublish)
    .select("Resource.id")
    .executeTakeFirst()
  return row !== undefined
}

// The upward analogue of withResourceSubtree: walks from `resourceId` up
// through Folder/Collection ancestors, stopping at the first parent that
// isn't a container (e.g. RootPage) or has none. Base row is `resourceId`
// itself, so if `resourceId` is itself a Folder/Collection its own id is
// still eligible to join to its own IndexPage below.
const withAncestorContainers = (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
) =>
  trx.withRecursive("ancestors", (eb) =>
    eb
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.id", "=", resourceId)
      .select(["Resource.id", "Resource.parentId"])
      // `union` (not `unionAll`) dedupes rows so a malformed parent chain
      // with a cycle can't drive the recursion forever.
      .union((fb) =>
        fb
          .selectFrom("Resource")
          .innerJoin("ancestors", "ancestors.parentId", "Resource.id")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "in", [
            ResourceType.Folder,
            ResourceType.Collection,
          ])
          .select(["Resource.id", "Resource.parentId"]),
      ),
  )

export interface AncestorIndexPage {
  id: string
  containerId: string
  publishedVersionId: string | null
  scheduledAt: Date | null
  scheduledAction: ScheduledAction | null
}

// The landing IndexPage of `resourceId` and of every Folder/Collection above
// it, up to the root — the upward counterpart of getPublishedDescendantResourceIds:
// that asks "is anything below me still live", this asks "is everything
// above me live (or on track to be)". `indexPage.id != resourceId` excludes
// self-matches: if `resourceId` is itself an IndexPage, its own container is
// walked as an ancestor row, and that container's child IndexPage is
// `resourceId` itself — this filter drops that, while still including the
// container's own IndexPage when `resourceId` is the *container* (a Folder/
// Collection id, as passed by the creation-time guards) since the container
// isn't its own IndexPage.
export const getAncestorIndexPages = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<AncestorIndexPage[]> => {
  const rows = await withAncestorContainers(trx, { siteId, resourceId })
    .selectFrom("ancestors")
    .innerJoin("Resource as indexPage", (join) =>
      join
        .onRef("indexPage.parentId", "=", "ancestors.id")
        .on("indexPage.type", "=", ResourceType.IndexPage),
    )
    .where("indexPage.siteId", "=", siteId)
    .where("indexPage.id", "!=", resourceId)
    .select([
      "indexPage.id as id",
      "ancestors.id as containerId",
      "indexPage.publishedVersionId as publishedVersionId",
      "indexPage.scheduledAt as scheduledAt",
      "indexPage.scheduledAction as scheduledAction",
    ])
    .execute()
  return rows.map((row) => ({
    id: String(row.id),
    containerId: String(row.containerId),
    publishedVersionId:
      row.publishedVersionId === null ? null : String(row.publishedVersionId),
    scheduledAt: row.scheduledAt,
    scheduledAction: row.scheduledAction,
  }))
}

// Number of ancestor Folder/Collection containers strictly above each id in
// `resourceIds` (excluding the id itself, even when it's itself a
// container), batched in one query rather than one recursive CTE per id.
// Used by the scheduled-publishing cron (schedulePublishingJob.ts) to order
// same-tick actions so a container's IndexPage always executes before
// (Publish) or after (Unpublish) the pages inside it, at any nesting depth
// — see the depth comment there for how an IndexPage's count is adjusted to
// match its own container's, not its sibling pages'. All ids must belong to
// `siteId`; callers with due resources spanning multiple sites call this
// once per site. Ids with zero ancestors are still present in the returned
// map (mapped to 0), since a batched query returns no row at all for them.
export const getContainerAncestorCounts = async (
  trx: SafeKysely,
  { siteId, resourceIds }: { siteId: number; resourceIds: string[] },
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>(resourceIds.map((id) => [id, 0]))
  if (resourceIds.length === 0) return counts

  const rows = await trx
    .withRecursive("ancestorBranches", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "in", resourceIds)
        .select(["Resource.id", "Resource.id as rootId", "Resource.parentId"])
        // `union` (not `unionAll`) dedupes rows so a malformed parent chain
        // with a cycle can't drive the recursion forever.
        .union((fb) =>
          fb
            .selectFrom("Resource")
            .innerJoin(
              "ancestorBranches",
              "ancestorBranches.parentId",
              "Resource.id",
            )
            .where("Resource.siteId", "=", siteId)
            .where("Resource.type", "in", [
              ResourceType.Folder,
              ResourceType.Collection,
            ])
            .select([
              "Resource.id",
              "ancestorBranches.rootId",
              "Resource.parentId",
            ]),
        ),
    )
    .selectFrom("ancestorBranches")
    .whereRef("ancestorBranches.id", "!=", "ancestorBranches.rootId")
    .groupBy("ancestorBranches.rootId")
    .select([
      "ancestorBranches.rootId as rootId",
      (eb) => eb.fn.countAll<number>().as("count"),
    ])
    .execute()

  for (const row of rows) {
    counts.set(String(row.rootId), Number(row.count))
  }
  return counts
}

// Ancestor IndexPages with a pending scheduled Unpublish, regardless of
// timing — an unconditional lock, not a time comparison. Once a container is
// scheduled to go dark, nothing underneath it may be published (immediately
// or via a future schedule) until that schedule fires or is cancelled.
// Sorted earliest-scheduledAt-first: callers take the first element to build
// an error message naming a specific scheduledAt, and an unsorted filter's
// row order isn't guaranteed — sorting keeps that message stable and names
// the soonest-firing (most actionable) lock when more than one ancestor is
// locked.
export const getLockingAncestorIndexPages = (rows: AncestorIndexPage[]) =>
  rows
    .filter(
      (row) =>
        row.scheduledAt !== null &&
        row.scheduledAction === ScheduledAction.Unpublish,
    )
    .sort(
      (a, b) =>
        (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0),
    )

// A published/live resource can't be moved into a container that's scheduled
// to go dark — it would either go live at a URL about to disappear, or (for
// a container being moved) sit on live content underneath a container that's
// about to unpublish. Walks the destination's own IndexPage AND every
// ancestor above it (getAncestorIndexPages is self-inclusive when
// `destinationId` is itself a container), since a lock further up the tree
// is just as disqualifying as one on the immediate destination. RootPage has
// no separate landing IndexPage and can never itself have a scheduled
// unpublish, so callers pass its type through and this is a no-op for it.
export const assertMoveDestinationUnlocked = async (
  tx: SafeKysely,
  {
    siteId,
    destinationId,
    destinationType,
    movedResourceId,
  }: {
    siteId: number
    destinationId: string
    destinationType: ResourceType
    movedResourceId: string
  },
) => {
  if (
    destinationType !== ResourceType.Folder &&
    destinationType !== ResourceType.Collection
  ) {
    return
  }

  const ancestorIndexPages = await getAncestorIndexPages(tx, {
    siteId,
    resourceId: destinationId,
  })
  const [lockingAncestor] = getLockingAncestorIndexPages(ancestorIndexPages)

  if (
    lockingAncestor &&
    (await hasPublishedDescendant(tx, {
      siteId,
      resourceId: movedResourceId,
    }))
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Cannot move a resource that is published (or has published pages inside it) into a folder or collection that is scheduled to be unpublished, or into one nested under such a folder or collection.",
    })
  }
}

// Blocks deleting a resource that's still live. Deletion cascades (parentId
// is onDelete: Cascade), so a Folder/Collection needs its whole subtree
// checked via hasPublishedDescendant, not just its own (always-null)
// publishedVersionId.
export const assertResourceNotLive = async (
  tx: SafeKysely,
  {
    siteId,
    resourceId,
    resourceType,
    publishedVersionId,
  }: {
    siteId: number
    resourceId: string
    resourceType: ResourceType
    publishedVersionId: string | null
  },
) => {
  const isContainer =
    resourceType === ResourceType.Folder ||
    resourceType === ResourceType.Collection

  const isLive = isContainer
    ? await hasPublishedDescendant(tx, { siteId, resourceId })
    : publishedVersionId !== null

  if (isLive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: isContainer
        ? `This ${resourceType === ResourceType.Folder ? "folder" : "collection"} has live pages inside it — unpublish them before deleting`
        : "This page must be unpublished before it can be deleted",
    })
  }
}

// Tags every direct child of `resourceId` (or every top-level resource, when
// `resourceId` is null) with its own id ("branchId"), then walks downward —
// each descendant inherits its ancestor's tag as the recursion goes deeper.
// Grouping by that tag at the end tells us, per child, whether it (or
// anything nested under it, at any depth) is published — one query answers
// this for every child at once, instead of walking one child's subtree per
// call.
//
// `hasLiveIndexPage` narrows that down to just the child's own immediate
// IndexPage (one level under it): a Folder/Collection is genuinely "Live"
// only when this is true, versus "Live · Template" when it's not published
// but `hasLiveDescendant` is still true because something deeper is live.
// TODO: remove_autogen has closed off new ways to reach the "Live · Template"
// state, but legacy data can still be in it. Once index-page autogeneration
// is properly removed (and any remaining legacy rows backfilled),
// `hasLiveDescendant`/"liveTemplate" should no longer be reachable and can
// be dropped, leaving just `hasLiveIndexPage`'s live/not-live check.
export const getChildLiveStatusMap = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string | null },
): Promise<
  Map<string, { hasLiveDescendant: boolean; hasLiveIndexPage: boolean }>
> => {
  const rows = await trx
    .withRecursive("branchSubtree", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where(
          "Resource.parentId",
          resourceId === null ? "is" : "=",
          resourceId,
        )
        .select([
          "Resource.id",
          "Resource.id as branchId",
          sql<number>`0`.as("depth"),
        ])
        // `union` (not `unionAll`) dedupes rows so a malformed parent chain with
        // a cycle can't drive the recursion forever.
        .union((fb) =>
          fb
            .selectFrom("Resource")
            .innerJoin("branchSubtree", "branchSubtree.id", "Resource.parentId")
            .where("Resource.siteId", "=", siteId)
            .select([
              "Resource.id",
              "branchSubtree.branchId",
              sql<number>`"branchSubtree"."depth" + 1`.as("depth"),
            ]),
        ),
    )
    .selectFrom("branchSubtree")
    .innerJoin("Resource", "Resource.id", "branchSubtree.id")
    .groupBy("branchSubtree.branchId")
    .select([
      "branchSubtree.branchId as branchId",
      sql<boolean>`bool_or("Resource"."publishedVersionId" is not null)`.as(
        "hasLiveDescendant",
      ),
      sql<boolean>`bool_or(
        "branchSubtree"."depth" = 1
        and "Resource"."type" = ${ResourceType.IndexPage}
        and "Resource"."publishedVersionId" is not null
      )`.as("hasLiveIndexPage"),
    ])
    .execute()

  return new Map(
    rows.map((row) => [
      String(row.branchId),
      {
        hasLiveDescendant: row.hasLiveDescendant,
        hasLiveIndexPage: row.hasLiveIndexPage,
      },
    ]),
  )
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
  trx: SafeKysely = db,
): Promise<Map<number, string>> => {
  if (resourceIds.length === 0) {
    return new Map()
  }

  // One recursive walk collects every node on the requested ids' ancestor
  // chains. A node's permalink and parentId are intrinsic to its id (not to
  // which chain reached it), so a single id-keyed map lets each requested id
  // walk from itself up to the root. Pass a `trx` to read uncommitted changes
  // (e.g. a rename mid-transaction) rather than the committed tree.
  const rows = await trx
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

  // Chunk the candidate lookup so a large bulk upload (many distinct segments)
  // can't push the IN (...) past Postgres' 65535 bind-parameter cap and fail the
  // whole query. Well under the cap; candidates from every chunk are merged.
  const SEGMENT_LOOKUP_CHUNK_SIZE = 20_000

  // One query per candidate-segment chunk across all paths, plus the root page
  // only when a bare "/" path is present.
  const [root, candidateChunks] = await Promise.all([
    needsRoot
      ? db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", ResourceType.RootPage)
          .where("Resource.parentId", "is", null)
          .select("Resource.id")
          .executeTakeFirst()
      : Promise.resolve(undefined),
    Promise.all(
      chunk(allSegments, SEGMENT_LOOKUP_CHUNK_SIZE).map((segments) =>
        db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.permalink", "in", segments)
          .select(["Resource.id", "Resource.permalink", "Resource.parentId"])
          .execute(),
      ),
    ),
  ])
  const candidates = candidateChunks.flat()

  // Index candidates by (parentId, permalink) so each segment step is an O(1)
  // lookup. A linear `candidates.find` per segment is O(segments * candidates),
  // which a large bulk upload against a resource-heavy site pushes into hundreds
  // of millions of comparisons — enough to block the event loop. The "/"
  // separator is safe: a parentId is only digits, so the concatenation is
  // injective — the first "/" always delimits parentId from permalink.
  const idByParentAndPermalink = new Map<string, string>()
  for (const candidate of candidates) {
    const key = `${candidate.parentId ?? ""}/${candidate.permalink}`
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
      const matchId = idByParentAndPermalink.get(`${parentId ?? ""}/${segment}`)
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

// Clears a resource's pending schedule, since a manual publish/unpublish
// that matches the schedule's direction makes it redundant (see the
// same-direction-proceeds comments in publishPageResource/unpublishPageResource).
const clearScheduledResource = (
  tx: Transaction<DB>,
  { id, siteId }: { id: number; siteId: number },
) =>
  updatePageById(
    { id, siteId, scheduledAt: null, scheduledBy: null, scheduledAction: null },
    tx,
  )

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

    // A schedule pending in the opposite direction (unpublish) would conflict
    // with publishing now, so block and make the caller cancel it first. A
    // same-direction schedule (publish) isn't a conflict — this manual
    // publish is just doing early what was already going to happen, so it
    // proceeds and clears the now-redundant schedule below. (No null-fallback
    // needed here: a legacy null scheduledAction defaults to Publish, which
    // is never the conflicting value for this check.)
    if (
      fullResource.scheduledAt &&
      fullResource.scheduledAction === ScheduledAction.Unpublish
    ) {
      throw new ScheduledActionConflictError(
        "unpublished",
        fullResource.scheduledAt,
      )
    }

    // A pending scheduled unpublish on an ancestor container's IndexPage
    // locks out publishing anything underneath it, at any nesting depth,
    // until that schedule fires or is cancelled (see
    // getLockingAncestorIndexPages/AncestorScheduledUnpublishLockError).
    // Walk from fullResource.id, not the raw `resourceId` param: the latter
    // may be an unresolved Folder/Collection id (see getFullPageById).
    const ancestorIndexPages = await getAncestorIndexPages(tx, {
      siteId,
      resourceId: fullResource.id,
    })
    const [lockingAncestor] = getLockingAncestorIndexPages(ancestorIndexPages)
    if (lockingAncestor?.scheduledAt) {
      throw new AncestorScheduledUnpublishLockError(lockingAncestor.scheduledAt)
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

    if (fullResource.scheduledAt) {
      await clearScheduledResource(tx, { id: Number(resourceId), siteId })
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

interface UnpublishPageResourceArgs {
  logger: Logger<string>
  userId: string
  siteId: number
  resourceId: string
  sitePublish?: {
    enableCodebuildJobs: boolean
  }
}

/**
 * scheduleUnpublish/cancelScheduleUnpublish accept the same input shape as
 * unpublishPageResource: a real page id, or a Folder/Collection id shorthand
 * for its landing page. resolveEffectiveResourceId resolves the container to
 * its child IndexPage before getPageById is called — a Folder/Collection
 * with no IndexPage yet has nothing to resolve to, so it falls through to
 * getPageById unchanged and is rejected there as not found (see
 * UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS for the wider allow-list this
 * gate validates the *original* id against, before resolution happens).
 */
// Shared across every unpublish-family check (unpublishPage's flag-off and
// wrong-type branches, scheduleUnpublish/cancelScheduleUnpublish's flag-off
// and not-found branches) so they're all indistinguishable from each other —
// load-bearing for the dark-launch trick, not just DRY.
export const UNPUBLISH_PAGE_NOT_FOUND_MESSAGE =
  "This page either does not exist or cannot be unpublished"

// Accepts the same input shape as unpublishPageResource: a real page id, or
// a Folder/Collection id shorthand for its landing page (resolved by the
// caller via resolveEffectiveResourceId, not here — this only validates
// that the *original* id given is a legitimate kind of thing to unpublish,
// before any resolution happens).
export const assertUnpublishableResourceType = async (
  db: SafeKysely,
  { resourceId, siteId }: { resourceId: number; siteId: number },
) => {
  const page = await db
    .selectFrom("Resource")
    .where("Resource.id", "=", String(resourceId))
    .where("Resource.siteId", "=", siteId)
    .where("Resource.type", "in", UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS)
    .select("Resource.id")
    .executeTakeFirst()

  if (!page) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: UNPUBLISH_PAGE_NOT_FOUND_MESSAGE,
    })
  }
}

/**
 * Takes a live page back to not-live. The draft (if any) and the Version
 * history are left untouched — only `publishedVersionId` is cleared (and
 * `state` flipped back to Draft, since several queries key "is this resource
 * currently live" off `state` rather than `publishedVersionId`).
 */
export const unpublishPageResource = async ({
  logger,
  siteId,
  resourceId,
  userId,
  sitePublish,
}: UnpublishPageResourceArgs) => {
  // May get swapped to the resolved IndexPage id below; declared out here so
  // the post-transaction `publishSite` call uses the right id.
  let targetResourceId = resourceId

  await db.transaction().execute(async (tx) => {
    const fullResource = await getFullPageById(tx, {
      resourceId: Number(resourceId),
      siteId,
    })

    if (!fullResource) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Please ensure you are attempting to unpublish a page that exists",
      })
    }

    if (!fullResource.publishedVersionId) {
      throw new PageAlreadyUnpublishedError()
    }

    // A schedule pending in the opposite direction (publish) would conflict
    // with unpublishing now, so block and make the caller cancel it first.
    // A same-direction schedule (unpublish) isn't a conflict — this manual
    // unpublish is just doing early what was already going to happen, so it
    // proceeds and clears the now-redundant schedule below. Unlike the
    // publish-side check, the null-fallback matters here: a resource
    // scheduled before scheduledAction existed has it stored as null, which
    // must still be treated as an implicit Publish schedule (see
    // schedulePublishingJob.ts's null-handling convention) to conflict.
    if (
      fullResource.scheduledAt &&
      (fullResource.scheduledAction ?? ScheduledAction.Publish) ===
        ScheduledAction.Publish
    ) {
      throw new ScheduledActionConflictError(
        "published",
        fullResource.scheduledAt,
      )
    }

    // Block unpublishing a container's landing page while a sibling or
    // nested page elsewhere in it is still live — mirrors the delete guard's
    // subtree check. fullResource's own id is filtered out since it's still
    // published at this point in the transaction.
    if (fullResource.type === ResourceType.IndexPage && fullResource.parentId) {
      const publishedDescendantIds = (
        await getPublishedDescendantResourceIds(tx, {
          siteId,
          resourceId: fullResource.parentId,
        })
      ).filter((id) => id !== fullResource.id)

      if (publishedDescendantIds.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This folder or collection has other live pages inside it — unpublish them before unpublishing its landing page",
        })
      }
    }

    const previousVersionId = fullResource.publishedVersionId

    let draftBlobId = fullResource.draftBlobId

    if (draftBlobId === null) {
      // No pending draft, so clone the published Blob into a fresh row
      // rather than pointing draftBlobId straight at it — draft edits mutate
      // a Blob in place (see updateBlobById), and the original is still
      // owned by the now-unpublished, and supposedly immutable, Version.
      const clonedBlob = await tx
        .insertInto("Blob")
        .values({ content: jsonb(fullResource.content) })
        .returning("Blob.id")
        .executeTakeFirstOrThrow()

      draftBlobId = clonedBlob.id
    }

    targetResourceId = fullResource.id

    await updatePageById(
      {
        id: Number(targetResourceId),
        siteId,
        publishedVersionId: null,
        draftBlobId,
        state: ResourceState.Draft,
        ...(fullResource.scheduledAt && {
          scheduledAt: null,
          scheduledBy: null,
          scheduledAction: null,
        }),
      },
      tx,
    )

    await logPublishEvent(tx, {
      siteId,
      by: await getUserById(userId),
      delta: {
        before: { versionId: previousVersionId },
        after: null,
      },
      eventType: AuditLogEvent.Unpublish,
      metadata: fullResource,
    })
  })

  // Trigger a rebuild of the site so the unpublished page's output is
  // removed from the live site, same as resource deletion does today.
  if (sitePublish)
    await publishSite(logger, {
      siteId,
      codebuildJob: sitePublish.enableCodebuildJobs
        ? {
            resourceWithUserIds: [{ resourceId: targetResourceId, userId }],
            isScheduled: false,
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
