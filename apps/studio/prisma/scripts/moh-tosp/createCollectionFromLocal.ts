import fs from "fs/promises"
import path from "path"
import { ResourceState, ResourceType } from "@prisma/client"

import { db, jsonb } from "~/server/modules/database"
import { FileLogger } from "../FileLogger"

// Update the logger path if required
const logger = new FileLogger("./createCollectionFromLocal.log")

export const createCollectionFromLocal = async (
  contentDir: string,
  siteId: number,
  indexPageName: string, // should be placed outside the folder
  indexPageTitle: string, // title of the index page
  collectionName: string,
  nameOfNewCollectionToCreate: string,
) => {
  logger.info(`Reading from ${contentDir}`)
  const jsonFilePath = path.join(contentDir, indexPageName)
  const folderPath = path.join(contentDir, collectionName)

  try {
    await db.transaction().execute(async (tx) => {
      // Step 1: Create a new collection with title "cost-financing-new"
      const collection = await tx
        .insertInto("Resource")
        .values({
          title: nameOfNewCollectionToCreate,
          permalink: nameOfNewCollectionToCreate,
          siteId: siteId,
          type: ResourceType.Collection,
          state: ResourceState.Draft,
          createdAt: new Date(),
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
          title: nameOfNewCollectionToCreate,
          permalink: "_index",
          siteId: siteId,
          type: ResourceType.IndexPage,
          parentId: collectionId,
          draftBlobId: indexPageBlob.id,
          state: ResourceState.Draft,
          createdAt: new Date(),
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedFileContent: any
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          parsedFileContent = JSON.parse(fileContent)
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`Error parsing JSON file: ${file}`)
          }
        }

        const blob = await tx
          .insertInto("Blob")
          .values({
            content: parsedFileContent as PrismaJson.BlobJsonContent,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const resource = await tx
          .insertInto("Resource")
          .values({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            title: parsedFileContent.page.title,
            permalink: file.replace(/\.json$/, ""), // remove the .json at the back on permalinks
            siteId: siteId, // Replace with appropriate site ID
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
const indexPagePath = "cost-financing.json"
const indexPageTitle = "Cost financing"
const collectionName = "cost-financing"
const nameOfNewCollectionToCreate = "cost-financing-new" // will also be the permalink
const siteId = 0
await createCollectionFromLocal(
  contentDir,
  siteId,
  indexPagePath,
  indexPageTitle,
  collectionName,
  nameOfNewCollectionToCreate,
)
