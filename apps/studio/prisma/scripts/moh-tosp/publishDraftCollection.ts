import { db } from "~/server/modules/database"

export const publishCollectionById = async (
  publisherId: string,
  collectionId: string,
) => {
  // First publish the collection
  await db.transaction().execute(async (tx) => {
    // Get collection
    const collection = await tx
      .selectFrom("Resource")
      .selectAll()
      .where("id", "=", collectionId)
      .executeTakeFirstOrThrow()

    if (collection.state !== "Draft") {
      throw new Error(
        `Collection with ID ${collectionId} cannot be published as it is either in Published state or draftBlobId is not present.`,
      )
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
        console.log(
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

      console.log(`Published child resource with ID ${child.id}`)
    }
  })
}

// NOTE: TODO: Put in the publisher ID and collection ID to publish
const publisherId = "0"
const collectionId = "0"
await publishCollectionById(publisherId, collectionId)
