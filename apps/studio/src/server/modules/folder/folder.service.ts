import { db, Resource, sql } from "../database"

export const retrieveFolderOrder = async (
  folderId: string | null,
): Promise<string[] | undefined> => {
  // NOTE: this can only happen if we are asking
  // for the folder order of the root page
  // which should never happen
  // as the root page does
  // not have the `ChildPages` component
  if (folderId === null) return undefined

  let order: Resource["id"][] | undefined

  const meta = await db
    .selectFrom("Resource as r")
    .leftJoin("Version as v", "v.resourceId", "r.id")
    .leftJoin("Blob as pb", "v.blobId", "pb.id")
    // NOTE: this is a left join because
    // the resource might not have a a draft blob
    // if it is newly published
    .leftJoin("Blob as db", "r.draftBlobId", "db.id")
    .where("type", "=", "FolderMeta")
    .where("r.parentId", "=", folderId)
    .select((eb) =>
      eb.fn
        // NOTE: if the user has updated the ordering since the last publish,
        // use that ordering rather than the previously published one
        .coalesce(
          sql<string[]>`db.content->'meta'->>'order'`,
          sql<string[]>`pb.content->'meta'->>'order'`,
        )
        .as("order"),
    )
    .executeTakeFirst()

  if (meta) {
    order = meta.order
  }

  return order
}

export const orderPagesBy = <T extends Pick<Resource, "id" | "title">>(
  pages: T[],
  order?: string[],
) => {
  return pages.toSorted((a, b) => {
    if (order === undefined) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    const [aIndex, bIndex] = [order.indexOf(a.id), order.indexOf(b.id)]

    if (aIndex === bIndex) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  })
}
