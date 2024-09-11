import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { SelectExpression } from "kysely"
import { type DB } from "~prisma/generated/generatedTypes"

import type { Resource, SafeKysely } from "../database"
import { getSitemapTree } from "~/utils/sitemap"
import { db } from "../database"
import { type Page } from "./resource.types"

// Specify the default columns to return from the Resource table
export const defaultResourceSelect: SelectExpression<DB, "Resource">[] = [
  "Resource.id",
  "Resource.title",
  "Resource.permalink",
  "Resource.siteId",
  "Resource.parentId",
  "Resource.publishedVersionId",
  "Resource.draftBlobId",
  "Resource.type",
  "Resource.state",
]
const defaultResourceWithBlobSelect: SelectExpression<
  DB,
  "Resource" | "Blob"
>[] = [...defaultResourceSelect, "Blob.content", "Blob.updatedAt"]

const defaultNavbarSelect: SelectExpression<DB, "Navbar">[] = [
  "Navbar.id",
  "Navbar.siteId",
  "Navbar.content",
]

const defaultFooterSelect: SelectExpression<DB, "Footer">[] = [
  "Footer.id",
  "Footer.siteId",
  "Footer.content",
]

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore excessive deep type instantiaton
    return draftBlob
  }

  return getById(db, args)
    .where("Resource.publishedVersionId", "is not", null)
    .innerJoin("Version", "Resource.publishedVersionId", "Version.id")
    .innerJoin("Blob", "Version.blobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .forUpdate()
    .executeTakeFirst()
}

// There are 3 types of pages this get query supports:
// Page, CollectionPage, RootPage
export const getPageById = (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) =>
  getById(db, args)
    .where((eb) =>
      eb.or([
        eb("type", "=", "Page"),
        eb("type", "=", "CollectionPage"),
        eb("type", "=", "RootPage"),
      ]),
    )
    .select(defaultResourceSelect)
    .executeTakeFirstOrThrow()

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
  db: SafeKysely,
  props: {
    pageId: number
    content: PrismaJson.BlobJsonContent
    siteId: number
  },
) => {
  const { pageId: id, content } = props
  const page = await db
    .selectFrom("Resource")
    .where("Resource.id", "=", String(id))
    .where("siteId", "=", props.siteId)
    // NOTE: We update the draft first
    // Main should only be updated at build
    .select("draftBlobId")
    .executeTakeFirstOrThrow()

  if (!page.draftBlobId) {
    // NOTE: no draft for this yet, need to create a new one
    const newBlob = await db
      .insertInto("Blob")
      .values({ content })
      .returning("id")
      .executeTakeFirstOrThrow()
    await db
      .updateTable("Resource")
      .where("id", "=", String(id))
      .set({ draftBlobId: newBlob.id })
      .execute()
  }

  return (
    db
      .updateTable("Blob")
      // NOTE: This works because a page has a 1-1 relation with a blob
      .set({ content })
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
// - The immediate children of the resource (if any)
// - The immediate siblings of the resource (if any)
// - The immediate children of those siblings (if any)
export const getLocalisedSitemap = async (
  siteId: number,
  resourceId?: number,
) => {
  if (resourceId === undefined) {
    // Provide a default sitemap with a single resource
    return {
      id: "0",
      layout: "content",
      title: "Root",
      summary: "",
      lastModified: new Date().toISOString(),
      permalink: "",
    }
  }

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
              "Folder",
              "Page",
              "CollectionPage",
              "RootPage",
            ])
            .innerJoin("ancestors", "ancestors.parentId", "Resource.id")
            .select(defaultResourceSelect),
        ),
    )
    // Step 2: Get the immediate children of the resource
    .with("immediateChildren", (eb) =>
      eb
        .selectFrom("Resource")
        .select(defaultResourceSelect)
        .where("Resource.siteId", "=", siteId)
        .where("Resource.parentId", "=", String(resourceId)),
    )
    // Step 3: Get the immediate siblings of the resource
    .with("immediateSiblings", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "!=", String(resourceId))
        .where((fb) => {
          if (resource.parentId === null) {
            return fb("Resource.parentId", "is", null)
          }
          return fb("Resource.parentId", "=", String(resourceId))
        })
        .select(defaultResourceSelect),
    )
    // Step 4: Get the immediate children of those siblings
    .with("siblingChildren", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.parentId", "in", (fb) =>
          fb.selectFrom("immediateSiblings").select("immediateSiblings.id"),
        )
        .select(defaultResourceSelect),
    )
    // Step 5: Combine all the resources in a single array
    .selectFrom("ancestors as Resource")
    .union((eb) =>
      eb
        .selectFrom("immediateChildren as Resource")
        .select(defaultResourceSelect),
    )
    .union((eb) =>
      eb
        .selectFrom("immediateSiblings as Resource")
        .select(defaultResourceSelect),
    )
    .union((eb) =>
      eb
        .selectFrom("siblingChildren as Resource")
        .select(defaultResourceSelect),
    )
    .select(defaultResourceSelect)
    .execute()

  // Step 6: Construct the localised sitemap object
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

export const getResourceFullPermalink = async (
  siteId: number,
  resourceId: number,
) => {
  const resourcePermalinks = await db
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
              "Folder",
              "Page",
              "CollectionPage",
              "RootPage",
            ])
            .innerJoin("ancestors", "ancestors.parentId", "Resource.id")
            .select(defaultResourceSelect),
        ),
    )
    .selectFrom("ancestors")
    .select("ancestors.permalink")
    .execute()

  return `/${resourcePermalinks
    .map((r) => r.permalink)
    .reverse()
    .join("/")}`
}
