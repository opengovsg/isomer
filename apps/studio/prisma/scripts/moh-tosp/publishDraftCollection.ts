import { db } from "~/server/modules/database"
import { FileLogger } from "../FileLogger"

// Update the logger path if required
const logger = new FileLogger("./publishCollectionById.log")

export const publishCollectionById = async (
  publisherId: string,
  collectionId: string,
) => {
  try {
    // First publish the collection
    await db.transaction().execute(async (tx) => {
      // Get collection
      const collection = await tx
        .selectFrom("Resource")
        .selectAll()
        .where("id", "=", collectionId)
        .executeTakeFirstOrThrow()

      if (collection.state !== "Draft") {
        const errMsg = `Collection with ID ${collectionId} cannot be published as it is either in Published state or draftBlobId is not present.`
        logger.error(errMsg)
        throw new Error(errMsg)
      }

      // Update collection state to Published
      await tx
        .updateTable("Resource")
        .set({
          state: "Published",
          draftBlobId: null,
          updatedAt: new Date(),
        })
        .where("id", "=", collectionId)
        .executeTakeFirstOrThrow()

      // Update all child resources to Published
      const children = await tx
        .selectFrom("Resource")
        .selectAll()
        .where("parentId", "=", collectionId)
        .execute()

      for (const child of children) {
        if (child.state === "Published" || child.draftBlobId === null) {
          logger.error(
            `Child resource with ID ${child.id} cannot be published as it is either in Published state or draftBlobId is not present.`,
          )
          continue
        }

        const childVersion = await tx
          .insertInto("Version")
          .values({
            blobId: child.draftBlobId,
            versionNum: 1,
            resourceId: child.id,
            publishedAt: new Date(),
            publishedBy: publisherId,
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        await tx
          .updateTable("Resource")
          .set({
            state: "Published",
            publishedVersionId: childVersion.id,
            draftBlobId: null,
            updatedAt: new Date(),
          })
          .where("id", "=", child.id)
          .executeTakeFirstOrThrow()

        logger.info(`Published child resource with ID ${child.id}`)
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error publishing collection by ID: ${error.message}`)
    }
  }
}

// NOTE: TODO: Put in the publisher ID and collection ID to publish
const publisherId = "xyz"
const collectionId = "0"
await publishCollectionById(publisherId, collectionId)
