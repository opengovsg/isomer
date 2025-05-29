// This migration is to update the Folders that currently
// do not have an `IndexPage` to have a default one.
// It is a one-time migration to update the existing Folder records
// It is not reversible

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { db, jsonb, ResourceType } from "~/server/modules/database"
import { createFolderIndexPage } from "~/server/modules/page/page.service"

export const createDefaultFolderIndexPage = async () => {
  const folderWithChildren = (
    await db
      .selectFrom("Resource as f")
      .leftJoin("Resource as ip", "f.id", "ip.parentId")
      .where("ip.type", "=", "IndexPage")
      .where("f.type", "=", "Folder")
      .select("f.id")
      .execute()
  ).map(({ id }) => id)

  const foldersWithoutIndex = await db
    .selectFrom("Resource as f")
    .where("type", "=", "Folder")
    .where("id", "not in", folderWithChildren)
    .select(["id", "title", "siteId"])
    .execute()

  if (foldersWithoutIndex.length === 0) {
    return
  }

  const defaultBlobs = foldersWithoutIndex.map((folder) => {
    const content = jsonb(createFolderIndexPage(folder.title))
    return [
      {
        content,
      },
      folder,
    ] satisfies [{ content: typeof content }, typeof folder]
  })

  for (const [defaultBlob, folder] of defaultBlobs) {
    try {
      await db.transaction().execute(async (tx) => {
        const insertedBlob = await tx
          .insertInto("Blob")
          .values(defaultBlob)
          .returning("id")
          .executeTakeFirstOrThrow()

        await tx
          .insertInto("Resource")
          .values({
            parentId: folder.id,
            title: folder.title,
            type: ResourceType.IndexPage,
            permalink: INDEX_PAGE_PERMALINK,
            // NOTE: No difference here in `Blob.content`;
            // we create the blobs based off `danglingFolders`
            // and this is also generated off `danglingFolders`
            // so the blob will always be defined
            draftBlobId: insertedBlob.id,
            siteId: folder.siteId,
          })
          .execute()

        // NOTE: not creating `Version` here to mimic default behaviour for folder creation
      })
    } catch (e) {
      console.error(
        `[ERROR]: Unable to create index page for Folder: ${folder.title} with id: ${folder.id}.\n Error received: ${JSON.stringify(e, null, 2)}`,
      )
    }
  }
}
