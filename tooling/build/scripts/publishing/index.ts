import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"
import * as dotenv from "dotenv"
import { Client } from "pg"

import type { Resource, SitemapEntry } from "./types"
import {
  GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
  GET_CONFIG,
  GET_FOOTER,
  GET_NAVBAR,
} from "./queries"
import { getIndexPageContents } from "./utils/getIndexPageContent"

dotenv.config()

// Env vars
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const SITE_ID = Number(process.env.SITE_ID)

// Unique identifier for pages of dangling directories
// Guaranteed to not be present in the database because we start from 1
const DANGLING_DIRECTORY_PAGE_ID = "-1"
const INDEX_PAGE_PERMALINK = "_index"
const PAGE_RESOURCE_TYPES = [
  "Page",
  "CollectionPage",
  "CollectionLink",
  "IndexPage",
  "RootPage",
]
const FOLDER_RESOURCE_TYPES = ["Folder", "Collection"]

const getConvertedPermalink = (fullPermalink: string) => {
  // NOTE: If the full permalink ends with `_index`,
  // we should remove it because this function
  // is called for generation of the permalink in the sitemap
  // and reflects what the users see.
  // Note that we can do an `endsWith` because
  // we prohibit users from using `_` as a character
  const fullPermalinkWithoutIndex = fullPermalink.endsWith(INDEX_PAGE_PERMALINK)
    ? fullPermalink.slice(0, -INDEX_PAGE_PERMALINK.length)
    : fullPermalink

  if (fullPermalinkWithoutIndex.endsWith("/")) {
    return fullPermalinkWithoutIndex.slice(0, -1)
  }

  return fullPermalinkWithoutIndex
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
    password: decodeURIComponent(DB_PASSWORD ?? ""),
    port: Number(DB_PORT),
  })

  const start = performance.now() // Start profiling

  try {
    await client.connect()

    // Fetch and write navbar, footer, and config JSONs
    await fetchAndWriteSiteData(client)

    // Fetch all resources and their full permalinks
    const resources = await getAllResourcesWithFullPermalinks(client)

    // Construct an array of sitemap entries
    const sitemapEntries: SitemapEntry[] = []

    // Process each resource
    for (const resource of resources) {
      logDebug(
        `Processing resource with id ${resource.id}, fullPermalink: ${resource.fullPermalink}`,
      )

      // Ensure the resource is a page (we don't need to write folders)
      if (PAGE_RESOURCE_TYPES.includes(resource.type) && resource.content) {
        // Inject page type and title into content before writing to file
        resource.content.page = {
          ...resource.content.page,
          title: resource.title,
        }
        const idOfFolder = resources.find(
          (item) =>
            resource.fullPermalink.endsWith(INDEX_PAGE_PERMALINK) &&
            resource.type !== "RootPage" &&
            item.fullPermalink ===
              getConvertedPermalink(resource.fullPermalink),
        )?.id

        const sitemapEntry: SitemapEntry = {
          id: idOfFolder ?? resource.id,
          title: resource.title,
          permalink: `/${getConvertedPermalink(resource.fullPermalink)}`,
          lastModified: new Date().toISOString(), // TODO: Update to updated_at column
          layout: resource.content.layout || "content",
          summary:
            (Array.isArray(resource.content.page.contentPageHeader?.summary)
              ? resource.content.page.contentPageHeader.summary.join(" ")
              : resource.content.page.contentPageHeader?.summary) ||
            resource.content.page.articlePageHeader?.summary ||
            resource.content.page.subtitle ||
            resource.content.page.description ||
            "",
          category: resource.content.page.category,
          date: resource.content.page.date,
          image: resource.content.page.image,
          ref: resource.content.page.ref, // For file and link layouts
        }

        sitemapEntries.push(sitemapEntry)

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

    const rootPage = sitemapEntries.find(
      (entry) => entry.permalink === "/",
    ) || {
      id: "0",
      title: "Home",
      permalink: "/",
      lastModified: new Date().toISOString(),
      layout: "homepage",
      summary: "Home page",
    }

    const sitemap = {
      ...rootPage,
      children: generateSitemapTree(
        resources,
        sitemapEntries,
        rootPage.permalink,
      ),
    }

    logDebug("Intermediate sitemap:", sitemap)

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

function generateSitemapTree(
  resources: Resource[],
  sitemapEntries: SitemapEntry[],
  pathPrefix: string,
): SitemapEntry[] | undefined {
  const pathPrefixWithoutLeadingSlash = pathPrefix.slice(1)

  const entriesWithPathPrefix = sitemapEntries.filter(
    (entry) =>
      entry.permalink.startsWith(
        `${pathPrefix.length === 1 ? "" : pathPrefix}/`,
      ) && entry.permalink !== "/",
  )

  // Base case: No entries with the path prefix - this is a leaf node
  if (entriesWithPathPrefix.length === 0) {
    return undefined
  }

  // Get the immediate children of the current path
  const childrenPaths = Array.from(
    new Set(
      entriesWithPathPrefix.map(
        (entry) =>
          entry.permalink
            .slice(
              pathPrefixWithoutLeadingSlash.length +
                (pathPrefix.length === 1 ? 1 : 2),
            )
            .split("/")[0],
      ),
    ),
  )

  // Identify children paths that might be dangling directories
  const danglingDirectories: SitemapEntry[] = childrenPaths
    .filter(
      (childPath) =>
        sitemapEntries.some((entry) =>
          entry.permalink.startsWith(
            `${pathPrefix.length === 1 ? "" : pathPrefix}/${childPath}/`,
          ),
        ) &&
        !sitemapEntries.some(
          (entry) =>
            entry.permalink ===
            `${pathPrefix.length === 1 ? "" : pathPrefix}/${childPath}`,
        ),
    )
    .map((danglingDirectory) => {
      const pageName = danglingDirectory.replace(/-/g, " ")
      const title = pageName.charAt(0).toUpperCase() + pageName.slice(1)
      logDebug(
        `Creating index page for dangling directory: ${danglingDirectory}`,
      )
      logDebug(
        "Checking using permalink:",
        pathPrefixWithoutLeadingSlash.length === 0
          ? danglingDirectory
          : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`,
      )
      const idOfFolder = resources.find(
        (resource) =>
          getConvertedPermalink(resource.fullPermalink) ===
            (pathPrefixWithoutLeadingSlash.length === 0
              ? danglingDirectory
              : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`) &&
          FOLDER_RESOURCE_TYPES.includes(resource.type),
      )?.id

      return {
        id: idOfFolder ?? DANGLING_DIRECTORY_PAGE_ID,
        title,
        permalink: `${pathPrefix.length === 1 ? "" : pathPrefix}/${danglingDirectory}`,
        lastModified: new Date().toISOString(),
        layout: "index",
        summary: `Pages in ${title}`,
      }
    })

  const existingChildren = entriesWithPathPrefix.filter(
    (entry) =>
      entry.permalink
        .slice(
          pathPrefixWithoutLeadingSlash.length +
            (pathPrefix.length === 1 ? 1 : 2),
        )
        .split("/").length === 1,
  )
  const children = [...existingChildren, ...danglingDirectories]

  children.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { numeric: true }),
  )

  return children.map((child) => ({
    ...child,
    children: generateSitemapTree(resources, sitemapEntries, child.permalink),
  }))
}

function getFolders(
  resources: Resource[],
  sitemapEntry: SitemapEntry,
): SitemapEntry[] {
  // Base case: No children - this is a leaf node
  if (!sitemapEntry.children) {
    return []
  }

  // Get all immediate children that are folders
  const folders = sitemapEntry.children.filter((child) =>
    resources.some(
      (resource) =>
        resource.id === child.id &&
        FOLDER_RESOURCE_TYPES.includes(resource.type),
    ),
  )

  // Recurse on all children
  return [
    ...folders,
    ...sitemapEntry.children.flatMap((child) => getFolders(resources, child)),
  ]
}

// Create the index page for all dangling directories
async function processDanglingDirectories(
  resources: Resource[],
  sitemapEntry: SitemapEntry,
) {
  // Base case: No children - this is a leaf node
  if (!sitemapEntry.children) {
    return
  }

  // Create index page for all immediate children that are dangling directories
  await Promise.all(
    getFolders(resources, sitemapEntry).map((child) => {
      const indexPageContent = getIndexPageContents(
        child.title,
        child.children ?? [],
      )

      return writeContentToFile(
        `${child.permalink}/${INDEX_PAGE_PERMALINK}`,
        indexPageContent,
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

async function writeContentToFile(
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
      const config = {
        site: {
          ...configResult.rows[0].config,
          siteName: configResult.rows[0].name,
        },
        ...configResult.rows[0].theme,
      }

      await writeJsonToFile(config, "config.json")
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
    fs.writeFileSync(filePath, JSON.stringify(content), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error(`Error writing ${filename} to file:`, error)
  }
}

main().catch((err) => console.error(err))
