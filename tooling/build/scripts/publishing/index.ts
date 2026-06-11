import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"
import { Client } from "pg"
import { ResourceType } from "~generated/generatedEnums"

import type { PageOnlySitemapEntry, Resource, SitemapEntry } from "./types"
import { PAGE_RESOURCE_TYPES } from "./constants"
import {
  GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
  GET_CONFIG,
  GET_FOOTER,
  GET_NAVBAR,
  GET_REDIRECTS,
} from "./queries"
import {
  buildPageSitemapEntry,
  DANGLING_DIRECTORY_PAGE_ID,
  generateSitemapTree,
  getDanglingDirectoryIndexPages,
  INDEX_PAGE_PERMALINK,
  logDebug,
} from "./sitemap"
import {
  getCollectionIndexPageContents,
  getFolderIndexPageContents,
} from "./utils/getIndexPageContent"

dotenv.config()

// Env vars
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const SITE_ID = Number(process.env.SITE_ID)

async function main() {
  const client = new Client({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_NAME,
    password: decodeURIComponent(DB_PASSWORD ?? ""),
    port: Number(DB_PORT),
  })

  const start = performance.now() // Start profiling

  try {
    await client.connect()

    // Fetch and write navbar, footer, and config JSONs
    await fetchAndWriteSiteData(client)

    // Fetch and write redirects
    await fetchAndWriteRedirects(client)

    // Fetch all resources and their full permalinks
    const resources = await getAllResourcesWithFullPermalinks(client)

    // Construct an array of sitemap entries
    const sitemapEntries: PageOnlySitemapEntry[] = []

    // Process each resource
    for (const resource of resources) {
      logDebug(
        `Processing resource with id ${resource.id}, fullPermalink: ${resource.fullPermalink}`,
      )

      // Ensure the resource is a page (we don't need to write folders)
      if (
        PAGE_RESOURCE_TYPES.find((t) => t === resource.type) &&
        resource.content
      ) {
        // Inject page type and title into content before writing to file
        resource.content.page = {
          ...resource.content.page,
          title: resource.title,
        }

        writeContentToFile(
          resource.fullPermalink,
          resource.content,
          resource.parentId,
        )

        sitemapEntries.push(buildPageSitemapEntry(resources, resource))
      } else {
        logDebug(
          `Skipping resource with id ${resource.id} as it is not a Page or has no content.`,
        )
      }
    }

    logDebug("Sitemap entries:", sitemapEntries)

    const rootPage = sitemapEntries.find(
      (entry) => entry.type === ResourceType.RootPage,
    ) ?? {
      id: "0",
      title: "Home",
      permalink: "/",
      lastModified: new Date().toISOString(),
      layout: "homepage",
      summary: "Home page",
      type: ResourceType.RootPage,
    }

    const sitemap = {
      ...rootPage,
      children: generateSitemapTree(
        resources,
        sitemapEntries,
        rootPage.permalink,
      ),
    }

    logDebug("Intermediate sitemap:", JSON.stringify(sitemap, null, 2))

    await processDanglingDirectories(resources, sitemap)

    try {
      // Create directories if they don't exist
      fs.mkdirSync(__dirname, { recursive: true })

      const filePath = path.join(__dirname, "sitemap.json")
      fs.writeFileSync(filePath, JSON.stringify(sitemap), "utf-8")

      logDebug(`Successfully wrote file: ${filePath}`)
    } catch (error) {
      console.error(`Error writing sitemap to file:`, error)
    }
  } finally {
    await client.end()
    const end = performance.now() // End profiling
    console.log(`Program completed in ${(end - start) / 1000} seconds`)
  }
}

// Create the index page for all dangling directories
async function processDanglingDirectories(
  resources: Resource[],
  sitemapEntry: SitemapEntry,
) {
  const indexPages = getDanglingDirectoryIndexPages(
    resources,
    sitemapEntry,
    getFolderIndexPageContents,
    getCollectionIndexPageContents,
  )

  // Create index page for all immediate children that are dangling directories
  await Promise.all(
    indexPages.map((child) => {
      return writeContentToFile(
        child.permalink,
        child.content,
        Number(DANGLING_DIRECTORY_PAGE_ID),
      )
    }),
  )
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

function writeContentToFile(
  fullPermalink: string | undefined,
  content: any,
  parentId: number | null,
) {
  try {
    // NOTE: do a join with ./ here so that
    // we don't end up with an absolute path to a special unix folder
    const sanitizedPermalink = !fullPermalink
      ? INDEX_PAGE_PERMALINK
      : path.join(
          "./",
          path
            // NOTE: normalization here will remove dual backslashes
            // and also strip .. filepaths except as a prefix
            .normalize(fullPermalink)
            // NOTE: this matches on a leading ../
            // or a leading ..\
            // or a plain .. without any paths
            .replace(/^(\.\.(\/|\\|$))+/, ""),
        )

    const directoryPath =
      parentId === null
        ? path.join(__dirname, "schema")
        : path.join(__dirname, "schema", path.dirname(sanitizedPermalink))

    const fileName = `${path.basename(sanitizedPermalink)}.json`
    const filePath = path.join(directoryPath, fileName)

    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true })

    // File may have already been written previously
    if (fs.existsSync(filePath)) {
      logDebug(`File already exists: ${filePath}`)
      return
    }

    // Write JSON content to file
    fs.writeFileSync(filePath, JSON.stringify(content), "utf-8")

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
      writeJsonToFile(navbarResult.rows[0].content, "navbar.json")
    }

    // Fetch footer.json
    const footerResult = await client.query(GET_FOOTER, [SITE_ID])
    if (footerResult.rows.length > 0) {
      writeJsonToFile(footerResult.rows[0].content, "footer.json")
    }

    // Fetch config.json
    const configResult = await client.query(GET_CONFIG, [SITE_ID])
    if (configResult.rows.length > 0) {
      const config = {
        site: {
          ...configResult.rows[0].config,
        },
        ...configResult.rows[0].theme,
      }

      writeJsonToFile(config, "config.json")
    }
  } catch (err) {
    console.error("Error fetching site data:", err)
  }
}

async function fetchAndWriteRedirects(client: Client) {
  try {
    const result = await client.query(GET_REDIRECTS, [SITE_ID])
    const redirects = result.rows as { source: string; destination: string }[]
    const filePath = path.join(__dirname, "redirects.json")
    fs.writeFileSync(filePath, JSON.stringify(redirects), "utf-8")
    logDebug(`Successfully wrote redirects: ${filePath}`)
  } catch (err) {
    console.error("Error fetching redirects:", err)
    fs.writeFileSync(
      path.join(__dirname, "redirects.json"),
      JSON.stringify([]),
      "utf-8",
    )
  }
}

function writeJsonToFile(content: any, filename: string) {
  const directoryPath = path.join(__dirname, "data")

  try {
    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true })

    const filePath = path.join(directoryPath, filename)
    fs.writeFileSync(filePath, JSON.stringify(content), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error(`Error writing ${filename} to file:`, error)
  }
}

main().catch((err) => console.error(err))
