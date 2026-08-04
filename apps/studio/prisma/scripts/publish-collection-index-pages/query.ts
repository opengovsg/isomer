import { db, ResourceType, sql } from "~/server/modules/database"

export interface TargetRow {
  resourceId: string
  siteId: number
  siteName: string
  parentPermalink: string
  parentTitle: string
  resourceTitle: string
  draftContent: unknown
  /**
   * Top-level `variant` from the sibling CollectionMeta's published blob. The
   * build's fabricated stub sources `variant` from here today, so we need it to
   * report the blog-variant flip risk. Report-only — never written.
   */
  collectionMetaVariant: string | null
}

/**
 * Expresses:
 *   select * from "Resource"
 *   where "type" = 'IndexPage'
 *     and "publishedVersionId" is null
 *     and "parentId" in (select id from "Resource" where "type" = 'Collection')
 *
 * The parent IN-subquery becomes an innerJoin: `Resource.id` is the PK so there is
 * no fan-out, and the join hands us the parent's title/permalink for free.
 *
 * One pass, no N+1 — deliberately NOT using `getBlobOfResource`, which costs a
 * round trip per resource AND falls through to the published blob, which is
 * exactly wrong here.
 */
export const findNeverPublishedCollectionIndexPages = async ({
  siteId,
}: { siteId?: number } = {}): Promise<TargetRow[]> =>
  db
    .selectFrom("Resource as r")
    .innerJoin("Resource as parent", "parent.id", "r.parentId")
    .innerJoin("Site as s", "s.id", "r.siteId")
    // LEFT join so a row with a null draftBlobId still surfaces and gets counted
    // rather than silently vanishing from the result set.
    .leftJoin("Blob as draftBlob", "draftBlob.id", "r.draftBlobId")
    .leftJoin("Resource as cmeta", (join) =>
      join
        .onRef("cmeta.parentId", "=", "r.parentId")
        .on("cmeta.type", "=", ResourceType.CollectionMeta),
    )
    .leftJoin("Version as cmetaV", "cmetaV.id", "cmeta.publishedVersionId")
    .leftJoin("Blob as cmetaBlob", "cmetaBlob.id", "cmetaV.blobId")
    .where("r.type", "=", ResourceType.IndexPage)
    .where("r.publishedVersionId", "is", null)
    .where("parent.type", "=", ResourceType.Collection)
    // A ternary rather than `$if`: it narrows `siteId` properly, so the optional
    // filter needs no non-null assertion.
    .where((eb) =>
      siteId === undefined ? eb.val(true) : eb("r.siteId", "=", siteId),
    )
    .select([
      "r.id as resourceId",
      "r.siteId as siteId",
      "s.name as siteName",
      "parent.permalink as parentPermalink",
      "parent.title as parentTitle",
      "r.title as resourceTitle",
      // Raw sql on the jsonb columns of LEFT-joined tables: mirrors the idiom in
      // collection.service.getCollectionTagsForResource, and sidesteps Kysely's
      // nullability inference on a PrismaJson-typed column.
      sql<unknown>`"draftBlob"."content"`.as("draftContent"),
      // ->> (not ->) so a string variant comes back as text, not "\"blog\"".
      sql<string | null>`"cmetaBlob"."content" ->> 'variant'`.as(
        "collectionMetaVariant",
      ),
    ])
    // Deterministic, so two dry-runs diff cleanly.
    .orderBy("r.siteId", "asc")
    .orderBy("r.id", "asc")
    .execute()
