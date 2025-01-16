const fs = require("fs").promises
const path = require("path")

const JSON_SCHEMA_VERSION = "0.1.0"
const schemaDirPath = path.join(__dirname, "../schema")
const sitemapPath = path.join(__dirname, "../sitemap.json")

const getResourceImage = (schemaData) => {
  if (schemaData.page.image) return schemaData.page.image

  if (!Array.isArray(schemaData.content)) return undefined

  const firstImageComponent = schemaData.content.find(
    (item) => item.type === "image",
  )
  return firstImageComponent
    ? {
        src: firstImageComponent.src,
        alt: firstImageComponent.alt,
      }
    : undefined
}

const getSchemaJson = async (filePath) => {
  try {
    const schemaContent = await fs.readFile(filePath, "utf8")
    return JSON.parse(schemaContent)
  } catch (error) {
    return null
  }
}

const getDirectoryItemStats = async (filePath) => {
  try {
    return await fs.stat(filePath)
  } catch (error) {
    return null
  }
}

const getHumanReadableFileSize = (bytes) => {
  const unit = 1000

  if (Math.abs(bytes) < unit) {
    return bytes + " B"
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  let index = -1

  while (Math.abs(bytes) >= unit && index < units.length - 1) {
    bytes /= unit
    index++
  }

  return `${bytes.toFixed(1)} ${units[index]}`
}

const getSiteMapEntry = async (fullPath, relativePath, name) => {
  const permalink = relativePath.split(".").slice(0, -1).join("-")
  const schemaData = await getSchemaJson(fullPath)
  const fileStats = await getDirectoryItemStats(fullPath)

  if (!schemaData || !fileStats) {
    return null
  }

  const pageName = name.split(".")[0].replace(/-/g, " ")
  const title =
    schemaData.page.title ||
    pageName.charAt(0).toUpperCase() + pageName.slice(1)
  const summary =
    (Array.isArray(schemaData.page.contentPageHeader?.summary)
      ? schemaData.page.contentPageHeader.summary.join(" ")
      : schemaData.page.contentPageHeader?.summary) ||
    schemaData.page.articlePageHeader?.summary ||
    schemaData.page.subtitle ||
    schemaData.page.description ||
    ""

  const siteMapEntry = {
    permalink,
    lastModified: fileStats.mtime,
    layout: schemaData.layout,
    title,
    summary,
    category: schemaData.page.category,
    date: schemaData.page.date,
    image: getResourceImage(schemaData),
    tags: schemaData.page.tags,
  }

  if (schemaData.layout === "file") {
    const refFilePath = path.join(__dirname, "../public", schemaData.page.ref)
    const refFileStats = await getDirectoryItemStats(refFilePath)

    if (!refFileStats) {
      return null
    }

    return {
      ...siteMapEntry,
      ref: schemaData.page.ref,
      fileDetails: {
        type: path.extname(refFilePath).slice(1).toUpperCase(),
        size: getHumanReadableFileSize(refFileStats.size),
      },
    }
  }

  if (schemaData.layout === "link") {
    return {
      ...siteMapEntry,
      ref: schemaData.page.ref,
    }
  }

  // Check if file is actually an index page for a directory
  const directoryPath = path.join(
    path.dirname(fullPath),
    path.basename(fullPath, ".json"),
  )
  const directoryItemStats = await getDirectoryItemStats(directoryPath)
  const isDirectoryAlsoPresent =
    directoryItemStats && directoryItemStats.isDirectory()

  if (isDirectoryAlsoPresent) {
    return {
      ...siteMapEntry,
      children: await getSiteMapChildrenEntries(directoryPath, permalink),
    }
  }

  return siteMapEntry
}

// Generates sitemap entries and an index file for directories without an index file
const processDanglingDirectory = async (fullPath, relativePath, name) => {
  const children = await getSiteMapChildrenEntries(fullPath, relativePath)
  const pageName = name.replace(/-/g, " ")
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1)
  const summary = `Pages in ${title}`
  const layout = "index"

  await fs.writeFile(
    path.join(fullPath + ".json"),
    JSON.stringify(
      {
        version: JSON_SCHEMA_VERSION,
        layout,
        page: {
          title,
          contentPageHeader: {
            summary,
          },
        },
        content: [],
      },
      null,
      2,
    ),
  )

  console.log("Generated missing index file for directory:", relativePath)

  return {
    permalink: relativePath,
    lastModified: new Date(),
    layout,
    title,
    summary,
    children,
  }
}

const getSiteMapChildrenEntries = async (fullPath, relativePath) => {
  const entries = await fs.readdir(fullPath, { withFileTypes: true })
  const fileEntries = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  )

  const children = []

  // Check if _meta.json exists
  const pageOrderFilePath = path.join(fullPath, "_meta.json")
  const pageOrderData = await getSchemaJson(pageOrderFilePath)

  if (pageOrderData) {
    const childPages = pageOrderData["order"]

    const childEntries = await Promise.all(
      childPages.map((child) => {
        const fileName = child + ".json"
        const childEntry = getSiteMapEntry(
          path.join(fullPath, fileName),
          path.join(relativePath, fileName),
          fileName,
        )

        return childEntry
      }),
    )

    children.push(...childEntries.filter((entry) => entry !== null))
  } else {
    // If _meta.json does not exist, process files in the directory in arbitrary order
    console.log("No _meta.json found for:", relativePath)

    const childEntries = await Promise.all(
      fileEntries
        .filter(
          (entry) => !(relativePath === "/" && entry.name === "index.json"),
        )
        .map((fileEntry) =>
          getSiteMapEntry(
            path.join(fullPath, fileEntry.name),
            path.join(relativePath, fileEntry.name),
            fileEntry.name,
          ),
        ),
    )

    children.push(...childEntries.filter((entry) => entry !== null))
  }

  // Process any directories that do not have a corresponding index file
  const danglingDirEntries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .filter(
        (dirEntry) =>
          !fileEntries.find(
            (fileEntry) => fileEntry.name === dirEntry.name + ".json",
          ),
      )
      .map((dirEntry) =>
        processDanglingDirectory(
          path.join(fullPath, dirEntry.name),
          path.join(relativePath, dirEntry.name),
          dirEntry.name,
        ),
      ),
  )

  children.push(...danglingDirEntries)

  // Ensure that the result is ordered in alphabetical order
  children.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { numeric: true }),
  )

  return children
}

const generateSitemap = async () => {
  const startTime = performance.now()
  const children = await getSiteMapChildrenEntries(schemaDirPath, "/")
  const indexJsonPath = path.join(schemaDirPath, "index.json")
  const indexJsonSchema = await getSchemaJson(indexJsonPath)
  const indexJsonStat = await getDirectoryItemStats(indexJsonPath)

  const sitemap = {
    permalink: "/",
    lastModified: indexJsonStat.mtime,
    layout: indexJsonSchema.layout,
    title: indexJsonSchema.page.title || "Home",
    summary: indexJsonSchema.page.description || "",
    children,
  }

  await fs.writeFile(sitemapPath, JSON.stringify(sitemap, null, 2))
  const endTime = performance.now()
  console.log("Sitemap generated at:", sitemapPath)
  console.log("Time taken:", (endTime - startTime) / 1000, "seconds")
}

generateSitemap().catch(console.error)
