import { db } from "~/server/modules/database"

export const deleteCollectionById = async (
  collectionId: string,
  siteId: number,
) => {
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
        if (resource.publishedVersionId) {
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

          if (blobIdToDelete) {
            await tx
              .deleteFrom("Blob")
              .where("id", "=", blobIdToDelete)
              .execute()
          }
        }

        // Delete draft blob, if applicable
        if (resource.draftBlobId) {
          await tx
            .deleteFrom("Blob")
            .where("id", "=", resource.draftBlobId)
            .execute()
        }

        // Delete the resource itself
        await tx.deleteFrom("Resource").where("id", "=", resource.id).execute()

        console.log(`Resource with ID ${resource.id} deleted successfully.`)
      }

      // Step 3: Delete the collection itself
      const collection = await tx
        .selectFrom("Resource")
        .select(["draftBlobId", "publishedVersionId"])
        .where("id", "=", collectionId)
        .executeTakeFirst()

      if (!collection) {
        throw new Error(`Collection with ID ${collectionId} not found.`)
      }

      // Handle published version and its blob for the collection
      if (collection.publishedVersionId) {
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

        if (blobIdToDelete) {
          await tx.deleteFrom("Blob").where("id", "=", blobIdToDelete).execute()
        }
      }

      // Delete the collection resource itself
      await tx.deleteFrom("Resource").where("id", "=", collectionId).execute()

      console.log(
        `Collection with ID ${collectionId} and all related data deleted successfully.`,
      )
    })
  } catch (error) {
    console.error("Error deleting collection:", error)
  }
}

const collectionIdToDelete = ""
const siteId = 0
await deleteCollectionById(collectionIdToDelete, siteId)
