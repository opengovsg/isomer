import { db, sql } from "~/server/modules/database"
import { updateBlobById } from "~/server/modules/resource/resource.service"

export const up = async () => {
  // Step 1: select all index pages and their blobs where
  // the text `"type": "childrenpages"` isn't found
  const sqlQuery = sql<{
    id: string
    siteId: string
    content: PrismaJson.BlobJsonContent
  }>`
    SELECT
      *
    FROM
      (
        SELECT
          COALESCE("db"."content", "pb"."content") AS "content",
          "Resource"."id", 
          "Resource"."siteId"
        FROM
          "Resource"
          LEFT JOIN "Version" ON "Version"."id" = "Resource"."publishedVersionId"
          LEFT JOIN "Blob" AS "pb" ON "pb"."id" = "Version"."blobId"
          LEFT JOIN "Blob" AS "db" ON "db"."id" = "Resource"."draftBlobId"
        WHERE
          "type" = 'IndexPage'
      ) AS "indexContent"
    WHERE
      ("content"->'content')::text ILIKE '%"type": "childrenpages"%' and "content" ->> 'layout' = 'index' and ("content" -> 'content')::text NOT ILIKE '%"childrenPagesOrdering"%';
`

  const result = await sqlQuery.execute(db)

  for (const r of result.rows) {
    const last = r.content.content.at(-1)

    // Skip if the last block is not a childrenpages block
    if (last?.type !== "childrenpages") {
      console.log(
        `Skipping Resource ${r.id}: last block is not childrenpages (type: ${last?.type})`,
      )
      continue
    }

    // Skip if childrenPagesOrdering already exists
    if (last.childrenPagesOrdering !== undefined) {
      console.log(
        `Skipping Resource ${r.id}: childrenPagesOrdering already exists`,
      )
      continue
    }

    console.log(
      `Updating Resource ${r.id}: adding childrenPagesOrdering to childrenpages block`,
    )

    try {
      const updated = [
        ...r.content.content.slice(0, -1),
        { ...last, childrenPagesOrdering: [] },
      ]
      const newContent = {
        ...r.content,
        content: updated,
      }

      await db.transaction().execute((tx) =>
        updateBlobById(tx, {
          pageId: Number(r.id),
          content: newContent as any,
          siteId: Number(r.siteId),
        }),
      )

      console.log(`Successfully updated Resource ${r.id}`)
    } catch (error) {
      console.error(`Failed to update Resource ${r.id}:`, error)
      // NOTE: don't throw here so we can reconcile manually
    }
  }
}

// NOTE: Uncomment the below to run the migration
// await up()

// NOTE: Clean up folderMeta after successful by running this query:
// delete from "Resource" where "type" = 'FolderMeta';
