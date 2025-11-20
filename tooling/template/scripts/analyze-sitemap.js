const fs = require("fs").promises
const path = require("path")

const SITEMAP_JSON = path.join(__dirname, "../public/sitemap.json")
const SCHEMA_DIR = path.join(__dirname, "../schema")
const OUTPUT_FILE = path.join(__dirname, "../sitemap-analysis.json")
const INDEX_PAGE_PERMALINK = "_index"

// Recursively extract all permalinks from sitemap
const extractPermalinks = (node, permalinks = []) => {
  if (node.permalink) {
    permalinks.push(node.permalink)
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      extractPermalinks(child, permalinks)
    })
  }

  return permalinks
}

// Get schema file path for a permalink
const getSchemaPath = (permalink) => {
  if (permalink === "/") {
    return path.join(SCHEMA_DIR, `${INDEX_PAGE_PERMALINK}.json`)
  }

  const permalinkWithoutSlash = permalink.replace(/^\//, "")
  const schemaPath = path.join(SCHEMA_DIR, `${permalinkWithoutSlash}.json`)

  return schemaPath
}

// Try to read schema file, handling index pages
const readSchema = async (permalink) => {
  const schemaPath = getSchemaPath(permalink)

  try {
    const content = await fs.readFile(schemaPath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    // If file doesn't exist, try as index page
    if (permalink === "") {
      return null
    }

    const permalinkWithoutSlash = permalink.replace(/^\//, "")
    const indexSchemaPath = path.join(
      SCHEMA_DIR,
      permalinkWithoutSlash,
      `${INDEX_PAGE_PERMALINK}.json`,
    )

    try {
      const content = await fs.readFile(indexSchemaPath, "utf8")
      return JSON.parse(content)
    } catch {
      return null
    }
  }
}

// Extract component types from content array
const extractComponents = (content) => {
  if (!Array.isArray(content)) {
    return []
  }

  const components = []
  content.forEach((item) => {
    if (item.type) {
      components.push(item.type)
    }
  })

  return components
}

// Analyze a single page
const analyzePage = async (permalink, layout) => {
  const schema = await readSchema(permalink)

  if (!schema) {
    return {
      permalink,
      layout: layout || "N/A",
      components: [],
    }
  }

  const components = extractComponents(schema.content || [])

  return {
    permalink,
    layout: schema.layout || layout || "N/A",
    components: [...new Set(components)], // Remove duplicates
  }
}

const main = async () => {
  try {
    console.log("Reading sitemap.json...")

    // Read sitemap.json
    const sitemapContent = await fs.readFile(SITEMAP_JSON, "utf8")
    const sitemap = JSON.parse(sitemapContent)

    // Extract all permalinks with their layouts
    const pages = []
    const extractPages = (node) => {
      if (node.permalink) {
        pages.push({
          permalink: node.permalink,
          layout: node.layout,
        })
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => {
          extractPages(child)
        })
      }
    }

    extractPages(sitemap)

    console.log(`Found ${pages.length} pages`)

    // Analyze each page and build output object
    const output = {}

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const result = await analyzePage(page.permalink, page.layout)

      // Create simple structure: { permalink: { layout, components } }
      output[result.permalink] = {
        layout: result.layout,
        components: result.components,
      }
    }

    // Write to JSON file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8")

    console.log(`\nOutput written to: ${OUTPUT_FILE}`)
    console.log(`\nTotal pages: ${Object.keys(output).length}`)
    console.log("")
  } catch (error) {
    console.error("Error:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
