import { DEFAULT_CHILDREN_PAGES_BLOCK } from "@opengovsg/isomer-components"

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
    // NOTE: We only care if it is `undefined`,
    // empty array is acceptable
    if (last?.type !== "childrenpages" || !last.childrenPagesOrdering) {
      console.log(
        `Found block that did not have type: childrenpages on Resource: ${r.id}`,
      )

      return
    }

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
  }
}

// NOTE: Uncomment the below to run the migration
// await up()

// NOTE: Clean up folderMeta after successful by running this query:
// delete from "Resource" where "type" = 'FolderMeta';
