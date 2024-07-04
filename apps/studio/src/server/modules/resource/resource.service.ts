import { db } from "../database"
import { type Footer, type Navbar, type Page } from "./resource.types"

export const getPages = () => {
  // TODO: write a test to verify this query behaviour
  return (
    db
      .selectFrom("Resource")
      // fetch pages where either a draft exists or a published blob exists
      .where((eb) =>
        eb.or([
          eb("publishedBlobId", "!=", null),
          eb("draftBlobId", "!=", null),
        ]),
      )
      .selectAll()
      .execute()
  )
}

export const getFolders = () =>
  // TODO: write a test to verify this query behaviour
  db
    .selectFrom("Resource")
    // fetch pages where both draft and published blobs are null
    .where("publishedBlobId", "is", null)
    .where("draftBlobId", "is", null)
    .selectAll()
    .execute()

// NOTE: Base method for retrieving a resource - no distinction made on whether `blobId` exists
const getById = (id: number) =>
  db.selectFrom("Resource").where("Resource.id", "=", id)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = async (id: number) => {
  // Check if draft blob exists and return that preferentially
  const draftBlob = await getById(id)
    .where("Resource.draftBlobId", "is not", null)
    .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .selectAll()
    .executeTakeFirst()
  if (draftBlob) return draftBlob

  return getById(id)
    .where("Resource.publishedBlobId", "is not", null)
    .innerJoin("Blob", "Resource.publishedBlobId", "Blob.id")
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const getPageById = (id: number) => {
  return getById(id)
    .where((eb) =>
      eb.or([eb("publishedBlobId", "!=", null), eb("draftBlobId", "!=", null)]),
    )
    .selectAll()
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
    .selectAll()
    // NOTE: Throwing here is acceptable because each site should have a navbar
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Navbar }
}

export const getFooter = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom("Footer")
    .where("siteId", "=", siteId)
    .selectAll()
    // NOTE: Throwing here is acceptable because each site should have a footer
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Footer }
}
