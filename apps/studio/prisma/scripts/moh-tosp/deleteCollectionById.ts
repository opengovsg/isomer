/* oxlint-disable typescript/no-unsafe-call -- studio lint cleanup */
import { db } from "~/server/modules/database/database"

import { FileLogger } from "../FileLogger"
import { hasNonEmptyString } from "../src/utils/truthiness"

// Update the logger path if required
const logger = new FileLogger("./deleteCollectionById.log")

interface DeleteCollectionByIdInput {
  collectionId: string
  siteId: number
}
export const deleteCollectionById = async ({
  collectionId,
  siteId,
}: DeleteCollectionByIdInput) => {
  try {
    await db.transaction().execute(async (tx) => {
      // Step 1: Find all child resources of the collection
      const childResources = await tx
        .selectFrom("Resource")
        .select(["id", "state", "draftBlobId", "publishedVersionId"])
        .where("parentId", "=", collectionId)
        .where("siteId", "=", siteId)
        .execute()

      // Step 2: Handle each child resource
      for (const resource of childResources) {
        // Delete published version and its blob, if applicable
        if (hasNonEmptyString(resource.publishedVersionId)) {
          const publishedVersion = await tx
            .selectFrom("Version")
            .select(["blobId"])
            .where("id", "=", resource.publishedVersionId)
            .executeTakeFirst()

          const blobIdToDelete = publishedVersion?.blobId

          await tx
            .deleteFrom("Version")
            .where("id", "=", resource.publishedVersionId)
            .execute()

          if (hasNonEmptyString(blobIdToDelete)) {
            await tx
              .deleteFrom("Blob")
              .where("id", "=", blobIdToDelete)
              .execute()
          }
        }

        // Delete draft blob, if applicable
        if (hasNonEmptyString(resource.draftBlobId)) {
          await tx
            .deleteFrom("Blob")
            .where("id", "=", resource.draftBlobId)
            .execute()
        }

        // Delete the resource itself
        await tx.deleteFrom("Resource").where("id", "=", resource.id).execute()

        logger.info(`Resource with ID ${resource.id} deleted successfully.`)
      }

      // Step 3: Delete the collection itself
      const collection = await tx
        .selectFrom("Resource")
        .select(["draftBlobId", "publishedVersionId"])
        .where("siteId", "=", siteId)
        .where("id", "=", collectionId)
        .executeTakeFirst()

      if (!collection) {
        throw new Error(`Collection with ID ${collectionId} not found.`)
      }

      // Handle published version and its blob for the collection
      if (hasNonEmptyString(collection.publishedVersionId)) {
        const publishedVersion = await tx
          .selectFrom("Version")
          .select(["blobId"])
          .where("id", "=", collection.publishedVersionId)
          .executeTakeFirst()

        const blobIdToDelete = publishedVersion?.blobId

        await tx
          .deleteFrom("Version")
          .where("id", "=", collection.publishedVersionId)
          .execute()

        if (hasNonEmptyString(blobIdToDelete)) {
          await tx.deleteFrom("Blob").where("id", "=", blobIdToDelete).execute()
        }
      }

      // Delete the collection resource itself
      await tx.deleteFrom("Resource").where("id", "=", collectionId).execute()

      logger.info(
        `Collection with ID ${collectionId} and all related data deleted successfully.`,
      )
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error deleting collection: ${error.message}`)
    }
  }
}

const collectionIdToDelete = "0"
const siteId = 0
await deleteCollectionById({ collectionId: collectionIdToDelete, siteId })
