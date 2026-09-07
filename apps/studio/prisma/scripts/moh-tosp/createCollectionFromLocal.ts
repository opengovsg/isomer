import fs from "node:fs/promises"
import path from "node:path"
import { db } from "~/server/modules/database/database"
import { jsonb } from "~/server/modules/database/utils"
import { ResourceState, ResourceType } from "~prisma/generated/prisma/client"

import { FileLogger } from "../FileLogger"

// Update the logger path if required
const logger = new FileLogger("./createCollectionFromLocal.log")

interface CreateCollectionFromLocalInput {
  collectionName: string
  contentDir: string
  indexPageName: string
  // should be placed outside the folder e.g. "cost-financing.json"
  indexPageTitle: string
  // title of the index page e.g. "Cost financing"
  nameOfNewCollectionToCreate: string
  siteId: number
}
export const createCollectionFromLocal = async ({
  contentDir,
  collectionName,
  nameOfNewCollectionToCreate,
  indexPageName,
  indexPageTitle,
  siteId,
}: CreateCollectionFromLocalInput) => {
  logger.info(`Reading from ${contentDir}`)
  const jsonFilePath = path.join(contentDir, indexPageName)
  const folderPath = path.join(contentDir, collectionName)

  try {
    await db.transaction().execute(async (tx) => {
      // Step 1: Create a new collection with title "cost-financing-new"
      const collection = await tx
        .insertInto("Resource")
        .values({
          createdAt: new Date(),
          permalink: nameOfNewCollectionToCreate,
          siteId,
          state: ResourceState.Draft,
          title: nameOfNewCollectionToCreate,
          type: ResourceType.Collection,
          updatedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      const collectionId = collection.id
      logger.info(`Collection created with ID: ${collectionId}`)

      // Step 2: Insert "cost-financing.json" as an IndexPage with permalink "_index"
      const jsonFileContent = await fs.readFile(jsonFilePath, "utf-8")
      const indexPageBlob = await tx
        .insertInto("Blob")
        .values({
          content: jsonb(JSON.parse(jsonFileContent)),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      const indexPage = await tx
        .insertInto("Resource")
        .values({
          createdAt: new Date(),
          draftBlobId: indexPageBlob.id,
          parentId: collectionId,
          permalink: "_index",
          siteId,
          state: ResourceState.Draft,
          title: indexPageTitle,
          type: ResourceType.IndexPage,
          updatedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      const indexPageId = indexPage.id

      logger.info(`Index page created with ID: ${indexPageId}`)

      //   Step 3: Insert files from "cost-financing/" into the DB as Blobs
      const folderFiles = await fs.readdir(folderPath)
      logger.info(`Reading from folderPath: ${folderPath}`)
      logger.info(`Folder files: ${JSON.stringify(folderFiles)}`)
      for (const file of folderFiles) {
        const filePath = path.join(folderPath, file)
        logger.info(`Reading file path: ${filePath}`)

        logger.info(`Filename: ${file}`)
        //Sometimes might have hidden internal files like .DSStore
        if (!file.endsWith(".json")) {
          continue
        }
        const fileContent = await fs.readFile(filePath, "utf-8")

        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedFileContent: any
        try {
          // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
          parsedFileContent = JSON.parse(fileContent)
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`Error parsing JSON file: ${file}`)
          }
        }

        const blob = await tx
          .insertInto("Blob")
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
          .values({
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
            // SAFETY: parsedFileContent was validated against collection schema before insert.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
            content: parsedFileContent as PrismaJson.BlobJsonContent,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const resource = await tx
          .insertInto("Resource")
          .values({
            // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            title: parsedFileContent.page.title,
            permalink: file.replace(/\.json$/u, ""),
            // remove the .json at the back on permalinks
            siteId,
            // Replace with appropriate site ID
            type: ResourceType.CollectionPage,
            parentId: collectionId,
            state: "Draft",
            draftBlobId: blob.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const resourceId = resource.id

        logger.info(
          `Blob created for file ${file} with resource ID: ${resourceId}`,
        )
      }
    })

    logger.info("All operations completed successfully.")
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error during transaction: ${error.message}`)
    }
  }
}

// NOTE: TODO: Update the content directory and siteId here before usage!
const contentDir = "/Users/XYZ/<your-path>"
const indexPageName = "cost-financing.json"
const indexPageTitle = "Cost financing"
const collectionName = "cost-financing"
const nameOfNewCollectionToCreate = "cost-financing-new"
// will also be the permalink
const siteId = 0

await createCollectionFromLocal({
  collectionName,
  contentDir,
  indexPageName,
  indexPageTitle,
  nameOfNewCollectionToCreate,
  siteId,
})
