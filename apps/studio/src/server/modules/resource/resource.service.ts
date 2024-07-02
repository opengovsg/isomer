import { db } from '../database'
import { type Page, type Footer, type Navbar } from './resource.types'

export const getPages = () => {
  return (
    db
      .selectFrom('Resource')
      // TODO: write a test to verify this query behaviour
      .where('blobId', '!=', null)
      .selectAll()
      .execute()
  )
}

export const getFolders = () =>
  db
    .selectFrom('Resource')
    // TODO: write a test to verify this query behaviour
    .where('blobId', '=', null)
    .selectAll()
    .execute()

// NOTE: Base method for retrieving a resource - no distinction made on whether `blobId` exists
const getById = (id: number) =>
  db.selectFrom('Resource').where('Resource.id', '=', id)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = (id: number) => {
  return getById(id)
    .where('Resource.blobId', 'is not', null)
    .innerJoin('Blob', 'Resource.blobId', 'Blob.id')
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const getPageById = (id: number) => {
  return getById(id)
    .where('blobId', '!=', null)
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const updatePageById = (
  page: Partial<Omit<Page, 'id'>> & { id: number },
) => {
  const { id, ...rest } = page
  return db.transaction().execute((tx) => {
    return tx
      .updateTable('Resource')
      .set(rest)
      .where('id', '=', id)
      .executeTakeFirstOrThrow()
  })
}

export const updateBlobById = (props: { id: number; content: string }) => {
  const { id, content } = props
  return db.transaction().execute((tx) => {
    return (
      tx
        .updateTable('Blob')
        .innerJoin('Resource', 'Resource.id', 'id')
        // NOTE: This works because a page has a 1-1 relation with a blob
        .set({ content })
        .where('Resource.id', '=', id)
        .executeTakeFirstOrThrow()
    )
  })
}

// TODO: should be selecting from new table
export const getNavBar = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom('Navbar')
    .where('siteId', '=', siteId)
    .selectAll()
    // NOTE: Throwing here is acceptable because each site should have a navbar
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Navbar }
}

export const getFooter = async (siteId: number) => {
  const { content, ...rest } = await db
    .selectFrom('Footer')
    .where('siteId', '=', siteId)
    .selectAll()
    // NOTE: Throwing here is acceptable because each site should have a footer
    .executeTakeFirstOrThrow()

  return { ...rest, content: content as Footer }
}
