import type { SelectExpression, Transaction } from "kysely"
import { type DB } from "~prisma/generated/generatedTypes"

import type { SafeKysely } from "../database"
import { db } from "../database"
import { type Page } from "./resource.types"

// Specify the default columns to return from the Resource table
const defaultResourceSelect: SelectExpression<DB, "Resource">[] = [
  "Resource.id",
  "Resource.title",
  "Resource.permalink",
  "Resource.siteId",
  "Resource.parentId",
  "Resource.mainBlobId",
  "Resource.draftBlobId",
  "Resource.type",
  "Resource.state",
]
const defaultResourceWithBlobSelect: SelectExpression<
  DB,
  "Resource" | "Blob"
>[] = [...defaultResourceSelect, "Blob.content"]

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
  tx: Transaction<DB>,
  args: {
    resourceId: number
    siteId: number
  },
) => {
  // Check if draft blob exists and return that preferentially
  const draftBlob = await getById(tx, args)
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

  return getById(tx, args)
    .where("Resource.mainBlobId", "is not", null)
    .innerJoin("Blob", "Resource.mainBlobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .forUpdate()
    .executeTakeFirst()
}

export const getPageById = (
  db: SafeKysely,
  args: { resourceId: number; siteId: number },
) => {
  return getById(db, args)
    .where("type", "is", "Page")
    .select(defaultResourceSelect)
    .executeTakeFirstOrThrow()
}

export const updatePageById = (
  page: Partial<Omit<Page, "id" | "siteId" | "parentId">> & {
    id: number
    siteId: number
    parentId?: number
  },
) => {
  const { id, parentId, ...rest } = page
  return db.transaction().execute((tx) => {
    return tx
      .updateTable("Resource")
      .set({ ...rest, ...(parentId && { parentId: String(parentId) }) })
      .where("siteId", "=", page.siteId)
      .where("id", "=", String(id))
      .executeTakeFirstOrThrow()
  })
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
    .set({ parentId: String(newParentId) })
    .where("siteId", "=", siteId)
    .where("id", "=", String(resourceId))
    .executeTakeFirstOrThrow()
}
