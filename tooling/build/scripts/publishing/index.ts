import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"
import * as dotenv from "dotenv"
import { Client } from "pg"

import {
  GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
  GET_CONFIG,
  GET_FOOTER,
  GET_NAVBAR,
} from "./queries"

dotenv.config()

// Env vars
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const SITE_ID = Number(process.env.SITE_ID)

interface Resource {
  id: number
  title: string
  permalink: string
  parentId: number | null
  type: string
  content?: any
  fullPermalink?: string
}

// Wrapper function for debug logging
function logDebug(message: string, ...optionalParams: any[]) {
  if (process.env.DEBUG === "true") {
    console.log(message, ...optionalParams)
  }
}

async function main() {
  const client = new Client({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: Number(DB_PORT),
  })

  const start = performance.now() // Start profiling

  try {
    await client.connect()

    // Fetch and write navbar, footer, and config JSONs
    await fetchAndWriteSiteData(client)

    // Fetch all resources and their full permalinks
    const resources = await getAllResourcesWithFullPermalinks(client)

    // Process each resource
    for (const resource of resources) {
      logDebug(
        `Processing resource with id ${resource.id}, fullPermalink: ${resource.fullPermalink}`,
      )
      // assert the resource is a page (we don't need to write folders)
      if (
        (resource.type === "Page" ||
          resource.type === "CollectionPage" ||
          resource.type === "RootPage") &&
        resource.content
      ) {
        await writeContentToFile(
          resource.fullPermalink,
          resource.content,
          resource.parentId,
        )
      } else {
        logDebug(
          `Skipping resource with id ${resource.id} as it is not a Page or has no content.`,
        )
      }
    }
  } finally {
    await client.end()
    const end = performance.now() // End profiling
    console.log(`Program completed in ${(end - start) / 1000} seconds`)
  }
}

async function getAllResourcesWithFullPermalinks(
  client: Client,
): Promise<Resource[]> {
  const values = [SITE_ID]

  try {
    const res = await client.query(
      GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
      values,
    )
    logDebug("Fetched resources with full permalinks:", res.rows)
    return res.rows
  } catch (err) {
    console.error("Error fetching resources:", err)
    return []
  }
}

async function writeContentToFile(
  fullPermalink: string | undefined,
  content: any,
  parentId: number | null,
) {
  try {
    if (!fullPermalink) {
      console.error("Error: fullPermalink is undefined or empty for resource")
      return
    }

    let directoryPath: string
    let fileName: string

    if (parentId === null) {
      // No enclosing folder if parentId is null
      directoryPath = path.join(__dirname, "schema")
      fileName = `${fullPermalink}.json`
    } else {
      directoryPath = path.join(
        __dirname,
        "schema",
        path.dirname(fullPermalink),
      )
      fileName = `${path.basename(fullPermalink)}.json`
    }

    if (!directoryPath || !fileName) {
      console.error("Error: directoryPath or fileName is undefined")
      return
    }

    const filePath = path.join(directoryPath, fileName)

    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true })

    // Write JSON content to file
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error("Error writing content to file:", error)
  }
}

async function fetchAndWriteSiteData(client: Client) {
  try {
    // Fetch navbar.json
    const navbarResult = await client.query(GET_NAVBAR, [SITE_ID])
    if (navbarResult.rows.length > 0) {
      await writeJsonToFile(navbarResult.rows[0].content, "navbar.json")
    }

    // Fetch footer.json
    const footerResult = await client.query(GET_FOOTER, [SITE_ID])
    if (footerResult.rows.length > 0) {
      await writeJsonToFile(footerResult.rows[0].content, "footer.json")
    }

    // Fetch config.json
    const configResult = await client.query(GET_CONFIG, [SITE_ID])
    if (configResult.rows.length > 0) {
      await writeJsonToFile(configResult.rows[0].config, "config.json")
    }
  } catch (err) {
    console.error("Error fetching site data:", err)
  }
}

async function writeJsonToFile(content: any, filename: string) {
  const directoryPath = path.join(__dirname, "data")

  try {
    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true })

    const filePath = path.join(directoryPath, filename)
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error(`Error writing ${filename} to file:`, error)
  }
}

main().catch((err) => console.error(err))
