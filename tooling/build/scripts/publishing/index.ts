import * as dotenv from "dotenv"
import fs from "node:fs"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { Client } from "pg"
import { ResourceType } from "~generated/generatedEnums"

import type { PageResourceType } from "./constants"
import type {
  PageOnlySitemapEntry,
  Resource,
  ResourceContent,
  SitemapEntry,
} from "./types"
import { FOLDER_RESOURCE_TYPES, PAGE_RESOURCE_TYPES } from "./constants"
import {
  GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
  GET_CONFIG,
  GET_FOOTER,
  GET_NAVBAR,
  GET_REDIRECTS,
} from "./queries"
import {
  getCollectionIndexPageContents,
  getFolderIndexPageContents,
} from "./utils/get-index-page-content"
import { getResourceFirstImage } from "./utils/get-resource-first-image"

dotenv.config()

const { DB_USERNAME } = process.env
const { DB_PASSWORD } = process.env
const { DB_HOST } = process.env
const { DB_PORT } = process.env
const { DB_NAME } = process.env
const DB_IAM_AUTH = process.env.DB_IAM_AUTH === "true"
const { DB_SSL_SERVERNAME } = process.env
const SITE_ID = Number(process.env.SITE_ID)
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? import.meta.dirname

const DANGLING_DIRECTORY_PAGE_ID = "-1"
const INDEX_PAGE_PERMALINK = "_index"
const META_PERMALINK = "_meta"

const getConvertedPermalink = (fullPermalink: string) => {
  let fullPermalinkWithoutIndex = fullPermalink
  if (fullPermalink.endsWith(INDEX_PAGE_PERMALINK)) {
    fullPermalinkWithoutIndex = fullPermalink.slice(
      0,
      -INDEX_PAGE_PERMALINK.length,
    )
  } else if (fullPermalink.endsWith(META_PERMALINK)) {
    fullPermalinkWithoutIndex = fullPermalink.slice(0, -META_PERMALINK.length)
  }

  if (fullPermalinkWithoutIndex.endsWith("/")) {
    return fullPermalinkWithoutIndex.slice(0, -1)
  }

  return fullPermalinkWithoutIndex
}

const logDebug = (message: string, ...optionalParams: unknown[]) => {
  if (process.env.DEBUG === "true") {
    console.log(message, ...optionalParams)
  }
}

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

const writeJsonToFile = (content: JsonValue, filename: string) => {
  const directoryPath = path.join(OUTPUT_DIR, "data")

  try {
    fs.mkdirSync(directoryPath, { recursive: true })

    const filePath = path.join(directoryPath, filename)
    fs.writeFileSync(filePath, JSON.stringify(content), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error(`Error writing ${filename} to file:`, error)
  }
}

const writeContentToFile = (
  fullPermalink: string | undefined,
  content: ResourceContent,
  parentId: number | null,
) => {
  try {
    const sanitizedPermalink =
      fullPermalink !== undefined && fullPermalink !== ""
        ? path.join(
            "./",
            path
              .normalize(fullPermalink)
              .replace(/^(?<prefix>\.\.(?:\/|\\|$))+/u, ""),
          )
        : INDEX_PAGE_PERMALINK

    const directoryPath =
      parentId === null
        ? path.join(OUTPUT_DIR, "schema")
        : path.join(OUTPUT_DIR, "schema", path.dirname(sanitizedPermalink))

    const fileName = `${path.basename(sanitizedPermalink)}.json`
    const filePath = path.join(directoryPath, fileName)

    fs.mkdirSync(directoryPath, { recursive: true })

    if (fs.existsSync(filePath)) {
      logDebug(`File already exists: ${filePath}`)
      return
    }

    fs.writeFileSync(filePath, JSON.stringify(content), "utf-8")

    logDebug(`Successfully wrote file: ${filePath}`)
  } catch (error) {
    console.error("Error writing content to file:", error)
  }
}

const getAllResourcesWithFullPermalinks = async (
  client: Client,
): Promise<Resource[]> => {
  const values = [SITE_ID]

  try {
    const res = await client.query(
      GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
      values,
    )
    logDebug("Fetched resources with full permalinks:", res.rows)
    return res.rows
  } catch (error) {
    console.error("Error fetching resources:", error)
    return []
  }
}

const fetchAndWriteSiteData = async (client: Client) => {
  try {
    const navbarResult = await client.query(GET_NAVBAR, [SITE_ID])
    if (navbarResult.rows.length > 0) {
      writeJsonToFile(navbarResult.rows[0].content, "navbar.json")
    }

    const footerResult = await client.query(GET_FOOTER, [SITE_ID])
    if (footerResult.rows.length > 0) {
      writeJsonToFile(footerResult.rows[0].content, "footer.json")
    }

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
  } catch (error) {
    console.error("Error fetching site data:", error)
  }
}

const fetchAndWriteRedirects = async (client: Client) => {
  try {
    const result = await client.query(GET_REDIRECTS, [SITE_ID])
    const redirects: { source: string; destination: string }[] = result.rows
    const filePath = path.join(OUTPUT_DIR, "redirects.json")
    fs.writeFileSync(filePath, JSON.stringify(redirects), "utf-8")
    logDebug(`Successfully wrote redirects: ${filePath}`)
  } catch (error) {
    console.error("Error fetching redirects:", error)
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "redirects.json"),
      JSON.stringify([]),
      "utf-8",
    )
  }
}

const generateSitemapTree = (
  resources: Resource[],
  sitemapEntries: PageOnlySitemapEntry[],
  pathPrefix: string,
): SitemapEntry[] | undefined => {
  const pathPrefixWithoutLeadingSlash = pathPrefix.slice(1)

  const entriesWithPathPrefix = sitemapEntries.filter(
    (entry) =>
      entry.permalink.startsWith(
        `${pathPrefix.length === 1 ? "" : pathPrefix}/`,
      ) && entry.permalink !== "/",
  )

  if (entriesWithPathPrefix.length === 0) {
    return undefined
  }

  const childrenPaths = [
    ...new Set(
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
  ]

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
      const pageName = danglingDirectory.replaceAll("-", " ")
      const generatedTitle =
        pageName.charAt(0).toUpperCase() + pageName.slice(1)

      const folder = resources.find(
        (resource) =>
          getConvertedPermalink(resource.fullPermalink) ===
            (pathPrefixWithoutLeadingSlash.length === 0
              ? danglingDirectory
              : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`) &&
          FOLDER_RESOURCE_TYPES.some((type) => type === resource.type),
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
        lastModified: new Date().toISOString(),
        layout: folder?.type === "Collection" ? "collection" : "index",
        permalink: `${pathPrefix.length === 1 ? "" : pathPrefix}/${danglingDirectory}`,
        summary: `Pages in ${title}`,
        title,
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

  const folderMetaOrder = resources.find(
    (resource) =>
      resource.type === "FolderMeta" &&
      resource.fullPermalink ===
        (pathPrefixWithoutLeadingSlash.length === 0
          ? META_PERMALINK
          : `${pathPrefixWithoutLeadingSlash}/${META_PERMALINK}`),
  )?.content?.order
  const pageOrderFromMeta = Array.isArray(folderMetaOrder)
    ? folderMetaOrder.filter((item): item is string => typeof item === "string")
    : undefined

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
      const child = children.find(({ id: childId }) => id === childId)

      return child?.permalink.split("/").pop()
    })
    .filter((permalink: string | undefined) => permalink !== undefined)

  const pageOrder: string[] = pageOrderFromIndex ?? pageOrderFromMeta ?? []

  children.sort((a, b) => {
    const aPermalink = a.permalink.split("/").pop()
    const bPermalink = b.permalink.split("/").pop()

    if (
      pageOrder.length === 0 ||
      aPermalink === undefined ||
      bPermalink === undefined ||
      pageOrder.indexOf(aPermalink) === pageOrder.indexOf(bPermalink)
    ) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    if (!pageOrder.includes(aPermalink)) {
      return 1
    }

    if (!pageOrder.includes(bPermalink)) {
      return -1
    }

    return pageOrder.indexOf(aPermalink) - pageOrder.indexOf(bPermalink)
  })

  return children.map((child) => ({
    ...child,
    children: generateSitemapTree(resources, sitemapEntries, child.permalink),
  }))
}

const getFoldersAndCollections = (
  resources: Resource[],
  sitemapEntry: SitemapEntry,
): SitemapEntry[] => {
  if (sitemapEntry.children === undefined) {
    return []
  }

  const folders = sitemapEntry.children.filter((child) =>
    resources.some(
      (resource) =>
        resource.id === child.id &&
        FOLDER_RESOURCE_TYPES.some((type) => type === resource.type),
    ),
  )

  return [
    ...folders,
    ...sitemapEntry.children.flatMap((child) =>
      getFoldersAndCollections(resources, child),
    ),
  ]
}

const processDanglingDirectories = (
  resources: Resource[],
  sitemapEntry: SitemapEntry,
) => {
  if (sitemapEntry.children === undefined) {
    return
  }

  const directories = getFoldersAndCollections(resources, sitemapEntry)
  const folders = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Folder,
  )
  const collections = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Collection,
  )

  const indexPages = [
    ...folders.map(({ title, permalink }) => {
      const content = getFolderIndexPageContents(title)
      return { content, permalink, title }
    }),
    ...collections.map(({ id, title, permalink }) => {
      const meta = resources.find(
        ({ type, parentId }) =>
          parentId === Number(id) && type === "CollectionMeta",
      )
      const content = getCollectionIndexPageContents(
        title,
        meta?.content.variant,
      )
      return { content, permalink, title }
    }),
  ]

  for (const child of indexPages) {
    writeContentToFile(
      `${child.permalink}/${INDEX_PAGE_PERMALINK}`,
      child.content,
      Number(DANGLING_DIRECTORY_PAGE_ID),
    )
  }
}

// SAFETY: PAGE_RESOURCE_TYPES is the canonical allow-list for page resource types.
const isPageResourceType = (type: string): type is PageResourceType =>
  (PAGE_RESOURCE_TYPES as readonly string[]).includes(type)

const buildSitemapEntry = (
  resource: Resource,
  resources: Resource[],
): PageOnlySitemapEntry => {
  const idOfFolder = resources.find(
    (item) =>
      resource.fullPermalink.endsWith(INDEX_PAGE_PERMALINK) &&
      resource.type !== "RootPage" &&
      item.fullPermalink === getConvertedPermalink(resource.fullPermalink),
  )?.id

  return {
    category: resource.content.page.category,
    collectionPagePageProps: {
      defaultSortBy: resource.content.page?.defaultSortBy,
      defaultSortDirection: resource.content.page?.defaultSortDirection,
      showThumbnail: resource.content.page?.showThumbnail,
      sortOrder: resource.content.page?.sortOrder,
      tagCategories: resource.content.page?.tagCategories,
    },
    date: resource.content.page.date,
    firstImage: getResourceFirstImage(resource),
    id: idOfFolder ?? resource.id,
    image: resource.content.page.image,
    lastModified: resource.updatedAt.toISOString(),
    layout: resource.content.layout ?? "content",
    permalink: `/${getConvertedPermalink(resource.fullPermalink)}`,
    ref: resource.content.page.ref,
    summary:
      (Array.isArray(resource.content.page.contentPageHeader?.summary)
        ? resource.content.page.contentPageHeader.summary.join(" ")
        : resource.content.page.contentPageHeader?.summary) ??
      resource.content.page.articlePageHeader?.summary ??
      resource.content.page.subtitle ??
      resource.content.page.description ??
      "",
    tagged: resource.content.page.tagged,
    tags: resource.content.page.tags,
    title: resource.title,
    type: isPageResourceType(resource.type) ? resource.type : "Page",
  }
}

const processPageResource = (
  resource: Resource,
  resources: Resource[],
  sitemapEntries: PageOnlySitemapEntry[],
) => {
  resource.content.page = {
    ...resource.content.page,
    title: resource.title,
  }

  writeContentToFile(
    resource.fullPermalink,
    resource.content,
    resource.parentId,
  )

  sitemapEntries.push(buildSitemapEntry(resource, resources))
}

const createDbClient = () => {
  const clientConfig = {
    database: DB_NAME,
    host: DB_HOST,
    password: DB_IAM_AUTH
      ? (DB_PASSWORD ?? "")
      : decodeURIComponent(DB_PASSWORD ?? ""),
    port: Number(DB_PORT),
    user: DB_USERNAME,
  }

  if (
    DB_IAM_AUTH &&
    DB_SSL_SERVERNAME !== undefined &&
    DB_SSL_SERVERNAME !== ""
  ) {
    return new Client({
      ...clientConfig,
      ssl: {
        rejectUnauthorized: false,
        servername: DB_SSL_SERVERNAME,
      },
    })
  }

  return new Client(clientConfig)
}

const main = async () => {
  const client = createDbClient()
  const start = performance.now()

  try {
    await client.connect()

    await fetchAndWriteSiteData(client)
    await fetchAndWriteRedirects(client)

    const resources = await getAllResourcesWithFullPermalinks(client)
    const sitemapEntries: PageOnlySitemapEntry[] = []

    for (const resource of resources) {
      logDebug(
        `Processing resource with id ${resource.id}, fullPermalink: ${resource.fullPermalink}`,
      )

      const isPageResource = PAGE_RESOURCE_TYPES.some(
        (type) => type === resource.type,
      )
      if (isPageResource && resource.content !== undefined) {
        processPageResource(resource, resources, sitemapEntries)
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
      lastModified: new Date().toISOString(),
      layout: "homepage",
      permalink: "/",
      summary: "Home page",
      title: "Home",
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

    processDanglingDirectories(resources, sitemap)

    try {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })

      const filePath = path.join(OUTPUT_DIR, "sitemap.json")
      fs.writeFileSync(filePath, JSON.stringify(sitemap), "utf-8")

      logDebug(`Successfully wrote file: ${filePath}`)
    } catch (error) {
      console.error(`Error writing sitemap to file:`, error)
    }
  } finally {
    await client.end()
    const end = performance.now()
    console.log(`Program completed in ${(end - start) / 1000} seconds`)
  }
}

try {
  await main()
} catch (error) {
  console.error(error)
}
