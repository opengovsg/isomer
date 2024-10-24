import type { SelectExpression } from "kysely"
import type { Logger } from "pino"
import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { type DB } from "~prisma/generated/generatedTypes"

import type { Resource, SafeKysely, Transaction } from "../database"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { getSitemapTree } from "~/utils/sitemap"
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb } from "../database"
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
    .where("type", "is", "Page")
    .select(defaultResourceSelect)
    .execute()
}

export const getFolders = () =>
  // TODO: write a test to verify this query behaviour
  db
    .selectFrom("Resource")
    .where("type", "is", "Folder")
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

// There are 4 types of pages this get query supports:
// Page, CollectionPage, RootPage, IndexPage
export const getPageById = (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) => {
  return getById(db, args)
    .where((eb) =>
      eb.or([
        eb("type", "=", "Page"),
        eb("type", "=", "CollectionPage"),
        eb("type", "=", "RootPage"),
        eb("type", "=", "IndexPage"),
        eb("type", "=", "CollectionLink"),
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

  if (!page.draftBlobId) {
    // NOTE: no draft for this yet, need to create a new one
    const newBlob = await tx
      .insertInto("Blob")
      .values({ content: jsonb(content) })
      .returning("id")
      .executeTakeFirstOrThrow()
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
      .where("Blob.id", "=", page.draftBlobId)
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
            .where("Resource.type", "in", ["Folder", "Collection"])
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
    .where("Resource.type", "=", "RootPage")
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

export const publishResource = async (
  logger: Logger<string>,
  siteId: number,
  resourceId: string,
  userId: string,
) => {
  // Step 1: Create a new version
  const addedVersionResult = await incrementVersion({
    siteId,
    resourceId,
    userId,
  })

  // Step 2: Trigger a publish of the site
  await publishSite(logger, siteId)

  return addedVersionResult
}
