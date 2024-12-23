import fs from "fs/promises" // Use the promise-based version of fs for async/await
import path from "path"

import { db } from "~/server/modules/database"
import { FileLogger } from "../FileLogger"

// Update the logger path if required
const logger = new FileLogger("./backupCollectionById.log")

/**
 * Backup a collection and its relevant resources to JSON files.
 * @param {string} resourceId - ID of the collection resource to back up.
 * @param {string} backupDir - Directory to save the backup files.
 */
export async function backupCollection(
  resourceId: string,
  backupDir: string,
): Promise<void> {
  try {
    // Ensure the backup directory exists
    await fs.mkdir(backupDir, { recursive: true })

    // Fetch the collection resource
    const collection = await db
      .selectFrom("Resource")
      .selectAll()
      .where("id", "=", resourceId)
      .executeTakeFirst()

    if (!collection) {
      throw new Error(`Collection with ID ${resourceId} not found.`)
    }

    // Fetch all child resources
    const children = await db
      .selectFrom("Resource")
      .selectAll()
      .where("parentId", "=", resourceId)
      .execute()

    // Write all the children's published version to the backup directory as JSON files
    for (const child of children) {
      // fetch the blob
      const blob = await db
        .selectFrom("Blob")
        .select("content")
        .innerJoin("Version", "Blob.id", "Version.blobId")
        .where("Version.id", "=", child.publishedVersionId)
        .executeTakeFirst()

      if (!blob) {
        throw new Error(
          `Published version of child with ID ${child.id} not found.`,
        )
      }

      logger.info(`Writing backup for child with ID ${child.id}`)

      // Parse blob content and write to a file
      const blobBuffer = blob.content // Assuming blob.content is a buffer
      const blobJsonPath = path.join(backupDir, `${child.title}.json`)
      await fs.writeFile(blobJsonPath, JSON.stringify(blobBuffer, null, 2))
    }

    logger.info(`Backup completed successfully in directory: ${backupDir}`)
  } catch (error: any) {
    logger.error(`Error backing up collection: ${error.message}`)
  }
}

// Run the backup
// NOTE: TODO: Put in the collection ID to backup
const collectionId = "5"
const backupDirectory =
  "/Users/harishv/Documents/Code/isomer/isomer-next/test-backup-tosp/backup"

await backupCollection(collectionId, backupDirectory).catch((err) => {
  logger.error("Unhandled error:", err.message)
})
