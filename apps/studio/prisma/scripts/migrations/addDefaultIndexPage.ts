// This migration is to update the Folders that currently
// do not have an `IndexPage` to have a default one.
// It is a one-time migration to update the existing Folder records
// It is not reversible

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { db, jsonb, ResourceType } from "~/server/modules/database"
import { createFolderIndexPage } from "~/server/modules/page/page.service"

export const createDefaultFolderIndexPage = async () => {
  try {
    const folderWithChildren = (
      await db
        .selectFrom("Resource as f")
        .leftJoin("Resource as ip", "f.id", "ip.parentId")
        .where("ip.type", "=", "IndexPage")
        .where("f.type", "=", "Folder")
        .select("f.id")
        .execute()
    ).map(({ id }) => id)

    const danglingFolders = await db
      .selectFrom("Resource as f")
      .where("type", "=", "Folder")
      .where("id", "not in", folderWithChildren)
      .select(["id", "title", "siteId"])
      .execute()

    const defaultBlobs = danglingFolders.map((folder) => ({
      content: jsonb(createFolderIndexPage(folder.title)),
    }))

    await db.transaction().execute(async (tx) => {
      const blobs = await tx
        .insertInto("Blob")
        .values(defaultBlobs)
        .returning("id")
        .execute()

      await tx
        .insertInto("Resource")
        .values(
          danglingFolders.map((folder, index) => {
            return {
              parentId: folder.id,
              title: folder.title,
              type: ResourceType.IndexPage,
              permalink: INDEX_PAGE_PERMALINK,
              // NOTE: No difference here in `Blob.content`;
              // we create the blobs based off `danglingFolders`
              // and this is also generated off `danglingFolders`
              // so the blob will always be defined
              draftBlobId: blobs[index]!.id,
              siteId: folder.siteId,
            }
          }),
        )
        .execute()

      // NOTE: not creating `Version` here to mimic default behaviour for folder creation
    })
  } catch (error) {
    console.error("Transaction failed:", error)
    console.log("All changes have been rolled back.")
    throw error
  }
}

// Uncomment to run the migration
// createDefaultFolderIndexPage()
