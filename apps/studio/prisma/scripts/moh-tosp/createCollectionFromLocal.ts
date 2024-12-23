import fs from "fs/promises"
import path from "path"

import { db, jsonb } from "~/server/modules/database"

export const createCollectionFromLocal = async (
  contentDir: string,
  siteId: number,
) => {
  console.log(`Reading from ${contentDir}`)
  const jsonFilePath = path.join(contentDir, "cost-financing.json")
  const folderPath = path.join(contentDir, "cost-financing-original")

  try {
    await db.transaction().execute(async (tx) => {
      // Step 1: Create a new collection with title "cost-financing-new"
      const collection = await tx
        .insertInto("Resource")
        .values({
          title: "cost-financing-new",
          permalink: "cost-financing-new",
          siteId: siteId,
          type: "Collection",
          state: "Draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      const collectionId = collection.id
      console.log(`Collection created with ID: ${collectionId}`)

      // Step 2: Insert "cost-financing.json" as an IndexPage with permalink "_index"\
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
          title: "cost-financing-new",
          permalink: "_index",
          siteId: siteId,
          type: "IndexPage",
          parentId: collectionId,
          draftBlobId: indexPageBlob.id,
          state: "Draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      const indexPageId = indexPage.id

      console.log(`Index page created with ID: ${indexPageId}`)

      //   Step 3: Insert files from "cost-financing/" into the DB as Blobs
      const folderFiles = await fs.readdir(folderPath)
      console.log(`Reading from folderPath: ${folderPath}`)
      console.log(`Folder files`, folderFiles)
      for (const file of folderFiles) {
        const filePath = path.join(folderPath, file)
        console.log(`Reading file path: ${filePath}`)

        console.log(`Filename: ${file}`)
        //Sometimes might have hidden internal files like .DSStore
        if (!file.endsWith(".json")) {
          continue
        }
        console.log("File path: ", filePath)
        const fileContent = await fs.readFile(filePath, "utf-8")

        const parsedFileContent = JSON.parse(fileContent)

        const blob = await tx
          .insertInto("Blob")
          .values({
            content: parsedFileContent,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const resource = await tx
          .insertInto("Resource")
          .values({
            title: parsedFileContent.page.title,
            permalink: file,
            siteId: siteId, // Replace with appropriate site ID
            type: "CollectionPage",
            parentId: collectionId,
            state: "Draft",
            draftBlobId: blob.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const resourceId = resource.id

        console.log(
          `Blob created for file ${file} with resource ID: ${resourceId}`,
        )
      }
    })

    console.log("All operations completed successfully.")
  } catch (error) {
    console.error("Error during transaction:", error)
  }
}

// NOTE: TODO: Update the content directory and siteId here before usage!
const contentDir = ""
const siteId = 0
await createCollectionFromLocal(contentDir, siteId)
