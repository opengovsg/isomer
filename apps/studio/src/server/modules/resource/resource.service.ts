import type { SelectExpression } from "kysely"
import type { Logger } from "pino"
import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { type DB } from "~prisma/generated/generatedTypes"
import _ from "lodash"

import type {
  Footer,
  Navbar,
  Resource,
  SafeKysely,
  Site,
  Transaction,
  User,
} from "../database"
import type { SearchResultResource } from "./resource.types"
import type { ResourceItemContent } from "~/schemas/resource"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { sendPublishingNotification } from "~/features/mail/service"
import { getSitemapTree } from "~/utils/sitemap"
import { logPublishEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb, ResourceType, sql } from "../database"
import { getSiteName } from "../site/site.service"
import { incrementVersion } from "../version/version.service"
import { type Page } from "./resource.types"

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
] satisfies SelectExpression<DB, "Resource">[]

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

export const getPages = () => {
  // TODO: write a test to verify this query behaviour
  return db
    .selectFrom("Resource")
    .where("type", "is", ResourceType.Page)
    .select(defaultResourceSelect)
    .execute()
}

export const getFolders = () =>
  // TODO: write a test to verify this query behaviour
  db
    .selectFrom("Resource")
    .where("type", "is", ResourceType.Folder)
    .select(defaultResourceSelect)
    .execute()

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
  {
    resourceId,
    siteId,
  }: {
    resourceId: number
    siteId: number
  },
) =>
  db
    .selectFrom("Resource")
    .where("Resource.id", "=", String(resourceId))
    .where("siteId", "=", siteId)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = async (
  db: SafeKysely,
  args: {
    resourceId: number
    siteId: number
  },
) => {
  // Check if draft blob exists and return that preferentially
  const draftBlob = await getById(db, args)
    .where("Resource.draftBlobId", "is not", null)
    .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .forUpdate()
    .executeTakeFirst()
  if (draftBlob) {
    return draftBlob
  }

  const publishedBlob = await getById(db, args)
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
  page: Partial<Omit<Page, "id" | "siteId" | "parentId">> & {
    id: number
    siteId: number
    parentId?: number
  },
  dbInstance?: SafeKysely,
) => {
  const dbObj = dbInstance ?? db
  const { id, parentId, ...rest } = page

  return dbObj
    .updateTable("Resource")
    .set({ ...rest, ...(parentId && { parentId: String(parentId) }) })
    .where("siteId", "=", page.siteId)
    .where("id", "=", String(id))
    .executeTakeFirstOrThrow()
}

export const getBlobOfResource = async ({
  tx,
  resourceId,
}: {
  tx: Transaction<DB>
  resourceId: string
}) => {
  const { draftBlobId, publishedVersionId } = await tx
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
      tx
        .selectFrom("Blob")
        .where("id", "=", draftBlobId)
        .selectAll()
        // NOTE: Guaranteed to exist since this is a foreign key
        .executeTakeFirstOrThrow()
    )
  }

  return tx
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
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resource not found",
    })
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
export const getNavBar = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Navbar")
    .where("siteId", "=", siteId)
    .select(defaultNavbarSelect)
    // NOTE: Throwing here is acceptable because each site should have a navbar
    .executeTakeFirstOrThrow()

  return { ...rest, content }
}

export const getFooter = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Footer")
    .where("siteId", "=", siteId)
    .select(defaultFooterSelect)
    // NOTE: Throwing here is acceptable because each site should have a footer
    .executeTakeFirstOrThrow()

  return { ...rest, content }
}

export const moveResource = async (
  siteId: number,
  resourceId: number,
  newParentId: number | null,
) => {
  return db
    .updateTable("Resource")
    .set({ parentId: !!newParentId ? String(newParentId) : null })
    .where("siteId", "=", siteId)
    .where("id", "=", String(resourceId))
    .executeTakeFirstOrThrow()
}

// Returns a sparse IsomerSitemap object that revolves around the given
// resourceId, which includes:
// - The full path from root to the actual resource
// - The immediate siblings of the resource (if any)
export const getLocalisedSitemap = async (
  siteId: number,
  resourceId: number,
) => {
  // Get the actual resource first
  const resource = await getById(db, {
    resourceId,
    siteId,
  })
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
        .select(defaultResourceSelect)
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
            .select(defaultResourceSelect),
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
        .select(defaultResourceSelect),
    )
    // Step 3: Combine all the resources in a single array
    .selectFrom("ancestors as Resource")
    .union((eb) =>
      eb
        .selectFrom("immediateSiblings as Resource")
        .select(defaultResourceSelect),
    )
    .select(defaultResourceSelect)
    .execute()

  // Step 4: Construct the localised sitemap object
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

  return getSitemapTree(rootResource, allResources)
}

export const getResourcePermalinkTree = async (
  siteId: number,
  resourceId: number,
): Promise<string[]> => {
  return db.transaction().execute(async (tx) => {
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
  })
}

export const getResourceFullPermalink = async (
  siteId: number,
  resourceId: number,
) => {
  const permalinkTree = await getResourcePermalinkTree(siteId, resourceId)
  if (permalinkTree.length === 0) {
    return null
  }
  return `/${permalinkTree.join("/")}`
}

export const publishPageResource = async (
  logger: Logger<string>,
  siteId: number,
  resourceId: string,
  userId: string,
) => {
  // Step 1: Create a new version
  const by = await db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please ensure that you have logged in",
        }),
    )

  const addedVersionResult = await db
    .transaction()
    .setIsolationLevel("serializable")
    .execute(async (tx) => {
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

      const version = await incrementVersion({
        tx,
        siteId,
        resourceId,
        userId,
      })

      const previousVersion = await tx
        .selectFrom("Version")
        .where("Version.versionNum", "=", Number(version.versionNum) - 1)
        .where("Version.resourceId", "=", resourceId)
        .select("Version.id")
        .executeTakeFirst()

      await logPublishEvent(tx, {
        by,
        delta: {
          before: previousVersion?.id
            ? { versionId: previousVersion.id }
            : null,
          after: version,
        },
        eventType: "Publish",
        metadata: fullResource,
      })

      return version
    })

  // Step 2: Trigger a publish of the site
  await publishSite(logger, siteId)

  // Step 3: Send a publishing notification
  const siteName = await getSiteName(siteId)
  await sendPublishingNotification({ recipientEmail: by.email, siteName })

  return addedVersionResult
}

// NOTE: The distinction here between `publishResource` and `publishPageResource` is that
// this should be used for publishes that do not incur a change to `Blob.content`
// and hence, don't incur a log to the `Version` table
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

  await db.transaction().execute(async (tx) => {
    await logPublishEvent(tx, {
      by: byUser,
      delta: {
        before: null,
        after: null,
      },
      eventType: "Publish",
      metadata: resource,
    })

    await publishSite(logger, resource.siteId)
  })

  // Send a publishing notification
  const siteName = await getSiteName(resource.siteId)
  await sendPublishingNotification({ recipientEmail: byUser.email, siteName })
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
      by: byUser,
      delta: {
        before: null,
        after: null,
      },
      eventType: "Publish",
      metadata: { site, ...rest },
    })

    await publishSite(logger, site.id)
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
  resourceId,
}: {
  resourceId: string
}) => {
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
        .where("r.parentId", "is", null)
        .unionAll(
          eb
            .selectFrom("Resource as s")
            .innerJoin("resourcePath as rp", "s.parentId", "rp.id")
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
    .where("rp.id", "=", resourceId)
    .executeTakeFirst()

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
      sql`GREATEST("Resource"."updatedAt", "Blob"."updatedAt")`.as(
        "lastUpdatedAt",
      ),
    ])
    .leftJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .where("Resource.siteId", "=", siteId)
}

const getResourcesWithFullPermalink = async ({
  resources,
}: {
  resources: Omit<SearchResultResource, "fullPermalink">[]
}): Promise<SearchResultResource[]> => {
  return await Promise.all(
    resources.map(async (resource) => ({
      ...resource,
      fullPermalink: await getWithFullPermalink({
        resourceId: resource.id,
      }).then((r) => r?.fullPermalink ?? ""),
    })),
  )
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
  const searchTerms: string[] = Array.from(
    new Set(query.trim().toLowerCase().split(/\s+/)),
  )

  const queriedResources = getResourcesWithLastUpdatedAt({
    siteId: Number(siteId),
  })
    .where("Resource.type", "in", resourceTypes)
    .where((eb) =>
      eb.or(
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

  const resourcesToReturn: SearchResultResource[] = (await orderedResources
    .offset(offset)
    .limit(limit)
    .execute()) as SearchResultResource[]

  const totalCount: number = (
    await db
      .with("queriedResources", () => queriedResources)
      .selectFrom("queriedResources")
      .select(db.fn.countAll().as("total_count"))
      .executeTakeFirstOrThrow()
  ).total_count as number // needed to cast as the type can be `bigint`

  return {
    totalCount,
    resources: await getResourcesWithFullPermalink({
      resources: resourcesToReturn,
    }),
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
    resources: (await getResourcesWithLastUpdatedAt({
      siteId: Number(siteId),
    })
      .where("Resource.type", "in", [
        // only show page-ish resources
        ResourceType.Page,
        ResourceType.CollectionLink,
        ResourceType.CollectionPage,
      ])
      .limit(limit)
      .orderBy("lastUpdatedAt", "desc")
      .execute()) as SearchResultResource[],
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
    resources: resources.map((resource) => ({
      ...resource,
      lastUpdatedAt: null,
    })),
  })
}

export const getFullResourceByVersion = (versionId: string) => {
  return db
    .selectFrom("Version")
    .innerJoin("Blob", "Version.blobId", "Blob.id")
    .innerJoin("Resource", "Version.resourceId", "Resource.id")
    .where("Version.id", "=", versionId)
    .select(defaultResourceWithBlobSelect)
    .executeTakeFirst()
}
