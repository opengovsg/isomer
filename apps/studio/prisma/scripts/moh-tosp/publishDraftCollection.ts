import { db } from "~/server/modules/database/database"
import { ResourceState } from "~prisma/generated/prisma/client"

import { FileLogger } from "../FileLogger"

// Update the logger path if required
const logger = new FileLogger("./publishDraftCollection.log")

interface PublishDraftCollectionInput {
  publisherId: string
  collectionId: string
}
export const publishCollectionById = async ({
  publisherId,
  collectionId,
}: PublishDraftCollectionInput) => {
  try {
    // First publish the collection
    await db.transaction().execute(async (tx) => {
      // Get collection
      const collection = await tx
        .selectFrom("Resource")
        .selectAll()
        .where("id", "=", collectionId)
        .executeTakeFirstOrThrow()

      if (collection.state !== ResourceState.Draft) {
        const errMsg = `Collection with ID ${collectionId} cannot be published as it is either in Published state or draftBlobId is not present.`
        logger.error(errMsg)
        throw new Error(errMsg)
      }

      // Update collection state to Published
      await tx
        .updateTable("Resource")
        .set({
          draftBlobId: null,
          state: ResourceState.Published,
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

      await Promise.all(
        children.map(async (child) => {
          if (
            child.state === ResourceState.Published ||
            child.draftBlobId === null
          ) {
            logger.error(
              `Child resource with ID ${child.id} cannot be published as it is either in Published state or draftBlobId is not present.`,
            )
            return
          }

          const childVersion = await tx
            .insertInto("Version")
            .values({
              blobId: child.draftBlobId,
              publishedAt: new Date(),
              publishedBy: publisherId,
              resourceId: child.id,
              updatedAt: new Date(),
              versionNum: 1,
            })
            .returning("id")
            .executeTakeFirstOrThrow()

          await tx
            .updateTable("Resource")
            .set({
              draftBlobId: null,
              publishedVersionId: childVersion.id,
              state: ResourceState.Published,
              updatedAt: new Date(),
            })
            .where("id", "=", child.id)
            .executeTakeFirstOrThrow()

          logger.info(`Published child resource with ID ${child.id}`)
        }),
      )
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
await publishCollectionById({ collectionId, publisherId })
