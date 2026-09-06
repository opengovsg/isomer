import fs from "node:fs/promises"
import path from "node:path"

import type { SchemaData, SitemapEntry } from "./sitemap-types.js"

const JSON_SCHEMA_VERSION = "0.1.0"
const schemaDirPath = path.join(import.meta.dirname, "../schema")
const sitemapPath = path.join(import.meta.dirname, "../sitemap.json")

const getResourceImage = (schemaData: SchemaData) => {
  if (schemaData.page.image !== undefined) {
    return schemaData.page.image
  }

  if (!Array.isArray(schemaData.content)) {
    return null
  }

  const firstImageComponent = schemaData.content.find(
    (item) => item.type === "image",
  )
  return firstImageComponent === undefined
    ? null
    : {
        alt: firstImageComponent.alt,
        src: firstImageComponent.src,
      }
}

const getSchemaJson = async (filePath: string): Promise<SchemaData | null> => {
  try {
    const schemaContent = await fs.readFile(filePath, "utf-8")
    // SAFETY: schema JSON files are produced by the publishing pipeline with a known shape.
    return JSON.parse(schemaContent) as SchemaData
  } catch {
    return null
  }
}

const getDirectoryItemStats = async (filePath: string) => {
  try {
    return await fs.stat(filePath)
  } catch {
    return null
  }
}

const getHumanReadableFileSize = (bytes: number) => {
  const unit = 1000

  if (Math.abs(bytes) < unit) {
    return `${bytes} B`
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  let index = -1
  let size = bytes

  while (Math.abs(size) >= unit && index < units.length - 1) {
    size /= unit
    index += 1
  }

  return `${size.toFixed(1)} ${units[index]}`
}

const buildBaseSiteMapEntry = (
  schemaData: SchemaData,
  fileStats: { mtime: Date },
  permalink: string,
  title: string,
  summary: string,
): SitemapEntry => ({
  category: schemaData.page.category,
  date: schemaData.page.date,
  image: getResourceImage(schemaData) ?? undefined,
  lastModified: fileStats.mtime,
  layout: schemaData.layout,
  permalink,
  summary,
  tags: schemaData.page.tags,
  title,
})

async function getSiteMapEntry(
  fullPath: string,
  relativePath: string,
  name: string,
): Promise<SitemapEntry | null> {
  const permalink = relativePath.split(".").slice(0, -1).join("-")
  const schemaData = await getSchemaJson(fullPath)
  const fileStats = await getDirectoryItemStats(fullPath)

  if (schemaData === null || fileStats === null) {
    return null
  }

  const pageName = name.split(".")[0].replaceAll("-", " ")
  const title =
    schemaData.page.title ??
    pageName.charAt(0).toUpperCase() + pageName.slice(1)
  const summary =
    (Array.isArray(schemaData.page.contentPageHeader?.summary)
      ? schemaData.page.contentPageHeader.summary.join(" ")
      : schemaData.page.contentPageHeader?.summary) ??
    schemaData.page.articlePageHeader?.summary ??
    schemaData.page.subtitle ??
    schemaData.page.description ??
    ""

  const siteMapEntry = buildBaseSiteMapEntry(
    schemaData,
    fileStats,
    permalink,
    title,
    summary,
  )

  if (schemaData.layout === "collection") {
    const collectionProps = schemaData.page.collectionPagePageProps
    if (collectionProps !== undefined) {
      siteMapEntry.collectionPagePageProps = {
        defaultSortBy: collectionProps.defaultSortBy,
        defaultSortDirection: collectionProps.defaultSortDirection,
      }
    }
  }

  if (schemaData.layout === "file") {
    const refFilePath = path.join(
      import.meta.dirname,
      "../public",
      schemaData.page.ref ?? "",
    )
    const refFileStats = await getDirectoryItemStats(refFilePath)

    if (refFileStats === null) {
      return null
    }

    return {
      ...siteMapEntry,
      fileDetails: {
        size: getHumanReadableFileSize(refFileStats.size),
        type: path.extname(refFilePath).slice(1).toUpperCase(),
      },
      ref: schemaData.page.ref,
    }
  }

  if (schemaData.layout === "link") {
    return {
      ...siteMapEntry,
      ref: schemaData.page.ref,
    }
  }

  const directoryPath = path.join(
    path.dirname(fullPath),
    path.basename(fullPath, ".json"),
  )
  const directoryItemStats = await getDirectoryItemStats(directoryPath)
  const isDirectoryAlsoPresent =
    directoryItemStats !== null && directoryItemStats.isDirectory()

  if (isDirectoryAlsoPresent) {
    return {
      ...siteMapEntry,
      children: await getSiteMapChildrenEntries(directoryPath, permalink),
    }
  }

  return siteMapEntry
}

async function processDanglingDirectory(
  fullPath: string,
  relativePath: string,
  name: string,
) {
  const children = await getSiteMapChildrenEntries(fullPath, relativePath)
  const pageName = name.replaceAll("-", " ")
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1)
  const summary = `Pages in ${title}`
  const layout = "index"

  await fs.writeFile(
    path.join(`${fullPath}.json`),
    JSON.stringify(
      {
        content: [],
        layout,
        page: {
          contentPageHeader: {
            summary,
          },
          title,
        },
        version: JSON_SCHEMA_VERSION,
      },
      null,
      2,
    ),
  )

  console.log("Generated missing index file for directory:", relativePath)

  return {
    children,
    lastModified: new Date(),
    layout,
    permalink: relativePath,
    summary,
    title,
  }
}

async function getSiteMapChildrenEntries(
  fullPath: string,
  relativePath: string,
): Promise<SitemapEntry[]> {
  const entries = await fs.readdir(fullPath, { withFileTypes: true })
  const fileEntries = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  )

  const children: SitemapEntry[] = []

  const pageOrderFilePath = path.join(fullPath, "_meta.json")
  const pageOrderData = await getSchemaJson(pageOrderFilePath)

  let childEntries: (SitemapEntry | null)[]

  if (pageOrderData === null) {
    console.log("No _meta.json found for:", relativePath)

    childEntries = await Promise.all(
      fileEntries
        .filter(
          (entry) => !(relativePath === "/" && entry.name === "index.json"),
        )
        .map(async (fileEntry) =>
          getSiteMapEntry(
            path.join(fullPath, fileEntry.name),
            path.join(relativePath, fileEntry.name),
            fileEntry.name,
          ),
        ),
    )
  } else {
    const childPages = pageOrderData.order ?? []

    childEntries = await Promise.all(
      childPages.map(async (child) => {
        const fileName = `${child}.json`
        return getSiteMapEntry(
          path.join(fullPath, fileName),
          path.join(relativePath, fileName),
          fileName,
        )
      }),
    )
  }

  children.push(...childEntries.filter((entry) => entry !== null))

  const danglingDirEntries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .filter(
        (dirEntry) =>
          !fileEntries.some(
            (fileEntry) => fileEntry.name === `${dirEntry.name}.json`,
          ),
      )
      .map(async (dirEntry) =>
        processDanglingDirectory(
          path.join(fullPath, dirEntry.name),
          path.join(relativePath, dirEntry.name),
          dirEntry.name,
        ),
      ),
  )

  children.push(...danglingDirEntries)

  children.sort((a, b) => {
    const aPermalink = a.permalink.split("/").pop() ?? ""
    const bPermalink = b.permalink.split("/").pop() ?? ""

    if (pageOrderData === null) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    const pageOrder = pageOrderData.order ?? []

    if (!pageOrder.includes(aPermalink)) {
      return 1
    }

    if (!pageOrder.includes(bPermalink)) {
      return -1
    }

    return pageOrder.indexOf(aPermalink) - pageOrder.indexOf(bPermalink)
  })

  return children
}

const generateSitemap = async () => {
  const startTime = performance.now()
  const children = await getSiteMapChildrenEntries(schemaDirPath, "/")
  const indexJsonPath = path.join(schemaDirPath, "index.json")
  const indexJsonSchema = await getSchemaJson(indexJsonPath)
  const indexJsonStat = await getDirectoryItemStats(indexJsonPath)

  if (indexJsonSchema === null || indexJsonStat === null) {
    throw new Error("Missing or invalid index.json in schema directory")
  }

  const sitemap = {
    children,
    lastModified: indexJsonStat.mtime,
    layout: indexJsonSchema.layout,
    permalink: "/",
    summary: indexJsonSchema.page.description ?? "",
    title: indexJsonSchema.page.title ?? "Home",
  }

  await fs.writeFile(sitemapPath, JSON.stringify(sitemap, null, 2))
  const endTime = performance.now()
  console.log("Sitemap generated at:", sitemapPath)
  console.log("Time taken:", (endTime - startTime) / 1000, "seconds")
}

try {
  await generateSitemap()
} catch (error) {
  console.error(error)
}
