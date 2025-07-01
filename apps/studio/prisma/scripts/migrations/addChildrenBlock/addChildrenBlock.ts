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
      ("content"->'content')::text NOT ILIKE '%"type": "childrenpages"%' and "content" ->> 'layout' = 'index';
`

  const result = await sqlQuery.execute(db)

  for (const r of result.rows) {
    const existing = r.content.content
    const updated = [...existing, DEFAULT_CHILDREN_PAGES_BLOCK]
    const newContent = {
      ...r.content,
      content: updated,
    }

    await db.transaction().execute((tx) =>
      updateBlobById(tx, {
        pageId: Number(r.id),
        content: newContent,
        siteId: Number(r.siteId),
      }),
    )
  }
}

// NOTE: Uncomment the below to run the migration
// await up()

// NOTE: Clean up folderMeta after successful by running this query:
// delete from "Resource" where "type" = 'FolderMeta';
