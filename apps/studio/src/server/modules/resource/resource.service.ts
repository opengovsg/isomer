import { db } from '../database'

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
const getById = (id: string) => db.selectFrom('Resource').where('id', '=', id)

// NOTE: Throw here to fail early if our invariant that a page has a `blobId` is violated
export const getFullPageById = (id: string) => {
  return getById(id)
    .where('blobId', '!=', null)
    .innerJoin('Blob', 'blobId', 'Blob.id')
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const getPageById = (id: string) => {
  return getById(id)
    .where('blobId', '!=', null)
    .selectAll()
    .executeTakeFirstOrThrow()
}

// TODO: should be selecting from new table
export const getNavBar = (siteId: string) => {
  return (
    db
      .selectFrom('Navbar')
      .where('siteId', '=', siteId)
      .innerJoin('NavbarItems', 'id', 'NavbarItems.navbarId')
      .selectAll()
      // NOTE: Throwing here is acceptable because each site should have a navbar
      .executeTakeFirstOrThrow()
  )
}

export const getFooter = (siteId: string) => {
  return (
    db
      .selectFrom('Footer')
      .where('siteId', '=', siteId)
      .selectAll()
      // NOTE: Throwing here is acceptable because each site should have a footer
      .executeTakeFirstOrThrow()
  )
}
