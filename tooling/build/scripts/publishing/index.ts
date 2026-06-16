import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"

import { createDb, ResourceType, sql } from "@isomer/db"

import type { PageResourceType } from "./constants"
import type {
  PageOnlySitemapEntry,
  Resource,
  ResourceRow,
  SitemapEntry,
} from "./types"
import { FOLDER_RESOURCE_TYPES, PAGE_RESOURCE_TYPES } from "./constants"
import { GET_ALL_RESOURCES_WITH_FULL_PERMALINKS } from "./queries"
import { toResource } from "./types"
import {
  getCollectionIndexPageContents,
  getFolderIndexPageContents,
} from "./utils/getIndexPageContent"
import { getResourceFirstImage } from "./utils/getResourceFirstImage"

dotenv.config()

// The Kysely instance produced by `@isomer/db`'s `createDb`. Each query is
// executed through it via the `sql` tag (SQL text is byte-identical to the
// previous raw-`pg` path; see queries.ts).
type Db = ReturnType<typeof createDb>

// Env vars
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const SITE_ID = Number(process.env.SITE_ID)
// Defaults to this package's directory, which publisher.sh expects in production
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? __dirname

// Unique identifier for pages of dangling directories
// Guaranteed to not be present in the database because we start from 1
const DANGLING_DIRECTORY_PAGE_ID = "-1"
const INDEX_PAGE_PERMALINK = "_index"
const META_PERMALINK = "_meta"

const getConvertedPermalink = (fullPermalink: string) => {
  // NOTE: If the full permalink ends with `_index`,
  // we should remove it because this function
  // is called for generation of the permalink in the sitemap
  // and reflects what the users see.
  // Note that we can do an `endsWith` because
  // we prohibit users from using `_` as a character
  const fullPermalinkWithoutIndex = fullPermalink.endsWith(INDEX_PAGE_PERMALINK)
    ? fullPermalink.slice(0, -INDEX_PAGE_PERMALINK.length)
    : fullPermalink.endsWith(META_PERMALINK)
      ? fullPermalink.slice(0, -META_PERMALINK.length)
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
  // Connection string assembled from the existing discrete env vars (decision
  // 8). The password is intentionally NOT `decodeURIComponent`-ed: the env
  // value is already percent-encoded, which is exactly what a URL userinfo
  // segment wants, and pg's URL parser decodes it.
  const db = createDb({
    connectionString: `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  })

  const start = performance.now() // Start profiling

  try {
    // Fetch and write navbar, footer, and config JSONs
    await fetchAndWriteSiteData(db)

    // Fetch and write redirects
    await fetchAndWriteRedirects(db)

    // Fetch all resources and their full permalinks
    const resources = await getAllResourcesWithFullPermalinks(db)

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

        // NOTE: We remap the ID for _index pages to be the ID of the folder,
        // as both will have the same permalink and the folder is recognized as
        // the parent of all the children resources
        const idOfFolder = resources.find(
          (item) =>
            resource.fullPermalink.endsWith(INDEX_PAGE_PERMALINK) &&
            resource.type !== "RootPage" &&
            item.fullPermalink ===
              getConvertedPermalink(resource.fullPermalink),
        )?.id

        const sitemapEntry: PageOnlySitemapEntry = {
          id: idOfFolder ?? resource.id,
          type: resource.type as PageResourceType,
          title: resource.title,
          permalink: `/${getConvertedPermalink(resource.fullPermalink)}`,
          lastModified: resource.updatedAt.toISOString(),
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
          tags: resource.content.page.tags,
          tagged: resource.content.page.tagged,
          date: resource.content.page.date,
          image: resource.content.page.image,
          firstImage: getResourceFirstImage(resource),
          ref: resource.content.page.ref, // For file and link layouts
          collectionPagePageProps: {
            tagCategories: resource.content.page?.tagCategories,
            sortOrder: resource.content.page?.sortOrder,
            defaultSortBy: resource.content.page?.defaultSortBy,
            defaultSortDirection: resource.content.page?.defaultSortDirection,
            showThumbnail: resource.content.page?.showThumbnail,
          },
        }

        sitemapEntries.push(sitemapEntry)
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
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })

      const filePath = path.join(OUTPUT_DIR, "sitemap.json")
      fs.writeFileSync(filePath, JSON.stringify(sitemap), "utf-8")

      logDebug(`Successfully wrote file: ${filePath}`)
    } catch (error) {
      console.error(`Error writing sitemap to file:`, error)
    }
  } finally {
    // One-shot script: drain the Kysely pool so the process exits.
    await db.destroy()
    const end = performance.now() // End profiling
    console.log(`Program completed in ${(end - start) / 1000} seconds`)
  }
}

function generateSitemapTree(
  resources: Resource[],
  sitemapEntries: PageOnlySitemapEntry[],
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

  // NOTE: Get the immediate children of the current path
  const childrenPaths = Array.from(
    new Set(
      entriesWithPathPrefix.map(
        (entry) =>
          entry.permalink
            .slice(
              // NOTE: This is either one or two based on whether it is the root.
              // This is because at this point, the path prefix would either be
              // `/`if root, or `/a/b/` if not root.
              // Hence, we have to remove the whole prefix based on whether it has
              // just a single `/`(the single `/` is both leading and trailing) or both leading and trailing `/`
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
      const generatedTitle =
        pageName.charAt(0).toUpperCase() + pageName.slice(1)

      const folder = resources.find(
        (resource) =>
          getConvertedPermalink(resource.fullPermalink) ===
            (pathPrefixWithoutLeadingSlash.length === 0
              ? danglingDirectory
              : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`) &&
          FOLDER_RESOURCE_TYPES.find((t) => t === resource.type),
      )
      const title = folder?.title ?? generatedTitle

      logDebug(
        `Creating index page for dangling directory: ${danglingDirectory}`,
      )
      logDebug(
        "Checking using permalink:",
        pathPrefixWithoutLeadingSlash.length === 0
          ? danglingDirectory
          : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`,
      )

      return {
        id: folder?.id ?? DANGLING_DIRECTORY_PAGE_ID,
        title,
        permalink: `${pathPrefix.length === 1 ? "" : pathPrefix}/${danglingDirectory}`,
        lastModified: new Date().toISOString(),
        layout: folder?.type === "Collection" ? "collection" : "index",
        summary: `Pages in ${title}`,
        type: folder?.type ?? ResourceType.Folder,
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

  // Get the page sorting order from the FolderMeta resource
  // TODO: delete this once `FolderMeta` is removed
  /** @deprecated use `pageOrderFromIndex` instead; we should remove this once `FolderMeta` is removed from db */
  const pageOrderFromMeta = resources.find(
    (resource) =>
      resource.type === "FolderMeta" &&
      resource.fullPermalink ===
        (pathPrefixWithoutLeadingSlash.length === 0
          ? META_PERMALINK
          : `${pathPrefixWithoutLeadingSlash}/${META_PERMALINK}`),
  )?.content?.order

  const pageOrderFromIndex = resources
    .find(
      (resource) =>
        resource.type === "IndexPage" &&
        resource.fullPermalink ===
          (pathPrefixWithoutLeadingSlash.length === 0
            ? INDEX_PAGE_PERMALINK
            : `${pathPrefixWithoutLeadingSlash}/${INDEX_PAGE_PERMALINK}`),
    )
    ?.content?.content?.find(
      ({ type }: { type: string }) => type === "childrenpages",
    )
    ?.childrenPagesOrdering?.map((id: string) => {
      const child = children.find(({ id: childId }) => {
        return id === childId
      })

      return child?.permalink.split("/").pop()
    })
    .filter((permalink: string | undefined) => !!permalink)

  const pageOrder = pageOrderFromIndex ?? pageOrderFromMeta

  children.sort((a, b) => {
    const aPermalink = a.permalink.split("/").pop()
    const bPermalink = b.permalink.split("/").pop()

    if (
      pageOrder === undefined ||
      pageOrder.indexOf(aPermalink) === pageOrder.indexOf(bPermalink)
    ) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    if (pageOrder.indexOf(aPermalink) === -1) {
      return 1
    }

    if (pageOrder.indexOf(bPermalink) === -1) {
      return -1
    }

    return pageOrder.indexOf(aPermalink) - pageOrder.indexOf(bPermalink)
  })

  return children.map((child) => ({
    ...child,
    children: generateSitemapTree(resources, sitemapEntries, child.permalink),
  }))
}

function getFoldersAndCollections(
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
        FOLDER_RESOURCE_TYPES.find((t) => t === resource.type),
    ),
  )

  // Recurse on all children
  return [
    ...folders,
    ...sitemapEntry.children.flatMap((child) =>
      getFoldersAndCollections(resources, child),
    ),
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

  const directories = getFoldersAndCollections(resources, sitemapEntry)
  const folders = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Folder,
  )
  const collections = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Collection,
  )

  // Create index page for all immediate children that are dangling directories
  await Promise.all(
    [
      ...folders.map(({ title, permalink }) => {
        const content = getFolderIndexPageContents(title)
        return { title, permalink, content }
      }),
      ...collections.map(({ id, title, permalink }) => {
        const meta = resources.find(
          ({ type, parentId }) =>
            // LATENT BUG, preserved deliberately (plan decision 6): `parentId`
            // is honestly a string but is compared to `Number(id)`, so this is
            // always false and CollectionMeta `variant` is never resolved here.
            // The fix is its own PR with its own test-expectation change; do NOT
            // coerce `parentId` or change `Number(id)`. The runtime expression
            // is byte-identical to main; only the type-error is suppressed.
            // @ts-expect-error string === number comparison is always false (see above)
            parentId === Number(id) && type === "CollectionMeta",
        )
        const content = getCollectionIndexPageContents(
          title,
          meta?.content?.variant,
        )
        return { title, permalink, content }
      }),
    ].map((child) => {
      return writeContentToFile(
        `${child.permalink}/${INDEX_PAGE_PERMALINK}`,
        child.content,
        Number(DANGLING_DIRECTORY_PAGE_ID),
      )
    }),
  )
}

// Execute the recursive-CTE SQL string from `queries.ts` through Kysely's `sql`
// tag, binding `SITE_ID` to the query's `$1` placeholders as a real bound
// parameter (never string-concatenated). The SQL text in `queries.ts` still
// contains `$1`; we split on it and interleave the bound `SITE_ID` value so the
// compiled query carries it as a parameter. The CTE references `$1` more than
// once and binds `SITE_ID` once per occurrence, which is equivalent for this
// read-only lookup. The four simple queries are now Kysely builder constructs
// (decision 9); only the CTE remains a typed `sql` template.
const runQuery = <Row>(db: Db, query: string) => {
  const fragments = query.split("$1")
  return sql<Row>`${sql.join(
    fragments.map((fragment) => sql.raw(fragment)),
    sql`${SITE_ID}`,
  )}`.execute(db)
}

async function getAllResourcesWithFullPermalinks(db: Db): Promise<Resource[]> {
  try {
    const { rows } = await runQuery<ResourceRow>(
      db,
      GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
    )
    logDebug("Fetched resources with full permalinks:", rows)
    // The seam: adapt honestly-typed raw rows to the script's working shape.
    return rows.map(toResource)
  } catch (err) {
    console.error("Error fetching resources:", err)
    return []
  }
}

function writeContentToFile(
  fullPermalink: string | undefined,
  content: any,
  // NOTE: callers pass either a resource's honest string `parentId` or the
  // numeric DANGLING_DIRECTORY_PAGE_ID sentinel; only the `=== null` branch is
  // load-bearing, so the value's runtime type is otherwise irrelevant.
  parentId: string | number | null,
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
        ? path.join(OUTPUT_DIR, "schema")
        : path.join(OUTPUT_DIR, "schema", path.dirname(sanitizedPermalink))

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

async function fetchAndWriteSiteData(db: Db) {
  try {
    // Fetch navbar.json
    const navbarRows = await db
      .selectFrom("Navbar")
      .select("content")
      .where("siteId", "=", SITE_ID)
      .execute()
    if (navbarRows.length > 0) {
      writeJsonToFile(navbarRows[0].content, "navbar.json")
    }

    // Fetch footer.json
    const footerRows = await db
      .selectFrom("Footer")
      .select("content")
      .where("siteId", "=", SITE_ID)
      .execute()
    if (footerRows.length > 0) {
      writeJsonToFile(footerRows[0].content, "footer.json")
    }

    // Fetch config.json
    const configRows = await db
      .selectFrom("Site")
      .select(["name", "config", "theme"])
      .where("id", "=", SITE_ID)
      .execute()
    if (configRows.length > 0) {
      const config = {
        site: {
          ...configRows[0].config,
        },
        ...configRows[0].theme,
      }

      writeJsonToFile(config, "config.json")
    }
  } catch (err) {
    console.error("Error fetching site data:", err)
  }
}

async function fetchAndWriteRedirects(db: Db) {
  try {
    const redirects = await db
      .selectFrom("Redirect")
      .select(["source", "destination"])
      .where("siteId", "=", SITE_ID)
      .where("deletedAt", "is", null)
      .execute()
    const filePath = path.join(OUTPUT_DIR, "redirects.json")
    fs.writeFileSync(filePath, JSON.stringify(redirects), "utf-8")
    logDebug(`Successfully wrote redirects: ${filePath}`)
  } catch (err) {
    console.error("Error fetching redirects:", err)
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "redirects.json"),
      JSON.stringify([]),
      "utf-8",
    )
  }
}

function writeJsonToFile(content: any, filename: string) {
  const directoryPath = path.join(OUTPUT_DIR, "data")

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
