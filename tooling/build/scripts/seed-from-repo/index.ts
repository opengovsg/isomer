import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"
import * as dotenv from "dotenv"
import { Client } from "pg"

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL
const SCHEMA_DIR = process.env.SCHEMA_DIR // Absolute path to the "schema" directory
const SITE_ID = Number(process.env.SITE_ID) // Ensure SITE_ID is set in the environment
const PUBLISHED_BY = "x" // Set the user ID for the publishedBy field

async function main() {
  if (!SCHEMA_DIR) {
    console.error("Error: SCHEMA_DIR environment variable is not set.")
    return
  }

  if (!SITE_ID) {
    console.error("Error: SITE_ID environment variable is not set.")
    return
  }

  const client = new Client({
    connectionString: DATABASE_URL,
  })

  const start = performance.now() // Start profiling

  try {
    await client.connect()

    const siteExists = await ensureSiteExists(client, SITE_ID)
    if (!siteExists) {
      console.error(`Error: Site with ID ${SITE_ID} does not exist.`)
      return
    }

    await seedDatabase(client)
  } finally {
    await client.end()
    const end = performance.now() // End profiling
    console.log(`Database seeding completed in ${(end - start) / 1000} seconds`)
  }
}

async function ensureSiteExists(
  client: Client,
  siteId: number,
): Promise<boolean> {
  const result = await client.query(
    `SELECT id FROM public."Site" WHERE id = $1`,
    [siteId],
  )
  return result.rows.length > 0
}

async function seedDatabase(client: Client) {
  async function processDirectory(dirPath: string, parentId: number | null) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Handle folder
        console.log(`Processing folder: ${entry.name}`)
        const resourceId = await createResource(client, {
          title: entry.name,
          permalink: entry.name, // Use folder name as permalink
          parentId,
          type: "Folder",
          siteId: SITE_ID,
        })
        await processDirectory(fullPath, resourceId)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Handle page
        console.log(`Processing file: ${entry.name}`)
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"))
        const title = content.page?.title || path.basename(entry.name, ".json")
        const permalink = path.basename(entry.name, ".json") // Only use the file name without extension
        const blobId = await createBlob(client, content)
        const resourceId = await createResource(client, {
          title,
          permalink,
          parentId,
          type: "Page",
          blobId,
          siteId: SITE_ID,
        })
        await createVersion(client, resourceId, blobId)
      }
    }
  }

  await processDirectory(SCHEMA_DIR!, null)
}

async function createBlob(client: Client, content: any): Promise<number> {
  const result = await client.query(
    `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
    [content],
  )
  return result.rows[0].id
}

async function createResource(
  client: Client,
  {
    title,
    permalink,
    parentId,
    type,
    blobId,
    siteId,
  }: {
    title: string
    permalink: string
    parentId: number | null
    type: "Page" | "Folder"
    blobId?: number
    siteId: number
  },
): Promise<number> {
  const result = await client.query(
    `INSERT INTO public."Resource" (title, permalink, "parentId", type, state, "publishedVersionId", "siteId") VALUES ($1, $2, $3, $4, $5, NULL, $6) RETURNING id`,
    [title, permalink, parentId, type, "Published", siteId],
  )
  return result.rows[0].id
}

async function createVersion(
  client: Client,
  resourceId: number,
  blobId: number,
) {
  const result = await client.query(
    `INSERT INTO public."Version" ("resourceId", "blobId", "versionNum", "publishedBy") VALUES ($1, $2, $3, $4) RETURNING id`,
    [resourceId, blobId, 1, PUBLISHED_BY], // Set versionNum to 1 and publishedBy to 123
  )
  const versionId = result.rows[0].id

  // Update the resource with the new publishedVersionId
  await client.query(
    `UPDATE public."Resource" SET "publishedVersionId" = $1 WHERE id = $2`,
    [versionId, resourceId],
  )
}

main().catch((err) => console.error(err))

export {}
