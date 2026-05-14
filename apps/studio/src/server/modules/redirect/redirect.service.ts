import { db, sql } from "../database"

interface RedirectRow {
  id: string
  source: string
  destination: string
  publishedAt: Date
  status: "active" | "deleted"
  hasUnpublishedChanges: boolean
}

interface ListRedirectsResult {
  items: RedirectRow[]
  totalCount: number
}

export const listRedirects = async ({
  siteId,
  sortBy,
  sortDirection,
  page,
  pageSize,
}: {
  siteId: number
  sortBy: "source" | "destination" | "createdAt"
  sortDirection: "asc" | "desc"
  page: number
  pageSize: number
}): Promise<ListRedirectsResult> => {
  const offset = (page - 1) * pageSize

  const baseQuery = db.selectFrom("Redirect").where("siteId", "=", siteId)

  const [items, countResult] = await Promise.all([
    baseQuery
      .select(["id", "source", "destination", "createdAt", "deletedAt"])
      .orderBy(sortBy, sortDirection)
      .offset(offset)
      .limit(pageSize)
      .execute(),
    baseQuery
      .select(sql<number>`count(*)::int`.as("count"))
      .executeTakeFirstOrThrow(),
  ])

  return {
    items: items.map((row) => ({
      id: String(row.id),
      source: row.source,
      destination: row.destination,
      publishedAt: row.createdAt,
      status: row.deletedAt ? ("deleted" as const) : ("active" as const),
      hasUnpublishedChanges: false,
    })),
    totalCount: countResult.count,
  }
}

export const publishRedirects = async ({
  siteId,
  creates,
  deletes,
}: {
  siteId: number
  creates: { source: string; destination: string }[]
  deletes: string[]
}): Promise<void> => {
  await db.transaction().execute(async (tx) => {
    if (deletes.length > 0) {
      await tx
        .updateTable("Redirect")
        .set({ deletedAt: new Date() })
        .where("siteId", "=", siteId)
        .where("id", "in", deletes)
        .where("deletedAt", "is", null)
        .execute()
    }

    if (creates.length > 0) {
      await tx
        .insertInto("Redirect")
        .values(creates.map((r) => ({ siteId, ...r })))
        .onConflict((oc) =>
          oc.columns(["siteId", "source"]).doUpdateSet((eb) => ({
            destination: eb.ref("excluded.destination"),
            deletedAt: null,
          })),
        )
        .execute()
    }
  })
}
