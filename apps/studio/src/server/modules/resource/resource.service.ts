import { type DB } from "~prisma/generated/generatedTypes"
import { SelectExpression } from "kysely"

import { db } from "../database"
import { type Footer, type Navbar, type Page } from "./resource.types"

// Specify the default columns to return from the Resource table
const defaultResourceSelect: SelectExpression<DB, "Resource">[] = [
  "Resource.id",
  "Resource.name",
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
const getByResourceId = (id: number) =>
  db.selectFrom("Resource").where("Resource.id", "=", id)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = async (id: number) => {
  // Check if draft blob exists and return that preferentially
  const draftBlob = await getByResourceId(id)
    .where("Resource.draftBlobId", "is not", null)
    .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .executeTakeFirst()
  if (draftBlob) return draftBlob

  return getByResourceId(id)
    .where("Resource.mainBlobId", "is not", null)
    .innerJoin("Blob", "Resource.mainBlobId", "Blob.id")
    .select(defaultResourceWithBlobSelect)
    .executeTakeFirstOrThrow()
}

export const getPageById = (id: number) => {
  return getByResourceId(id)
    .where("type", "is", "Page")
    .select(defaultResourceSelect)
    .executeTakeFirstOrThrow()
}

export const updatePageById = (
  page: Partial<Omit<Page, "id">> & { id: number },
) => {
  const { id, ...rest } = page
  return db.transaction().execute((tx) => {
    return tx
      .updateTable("Resource")
      .set(rest)
      .where("id", "=", id)
      .executeTakeFirstOrThrow()
  })
}

export const updateBlobById = (props: { id: number; content: string }) => {
  const { id, content } = props
  return db.transaction().execute((tx) => {
    return (
      tx
        .updateTable("Blob")
        .innerJoin("Resource", "Resource.id", "id")
        // NOTE: This works because a page has a 1-1 relation with a blob
        .set({ content })
        .where("Resource.id", "=", id)
        .executeTakeFirstOrThrow()
    )
  })
}

// TODO: should be selecting from new table
export const getNavBar = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Navbar")
    .where("siteId", "=", siteId)
    .select(defaultNavbarSelect)
    // NOTE: Throwing here is acceptable because each site should have a navbar
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Navbar }
}

export const getFooter = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Footer")
    .where("siteId", "=", siteId)
    .select(defaultFooterSelect)
    // NOTE: Throwing here is acceptable because each site should have a footer
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Footer }
}
