const fs = require("fs").promises
const path = require("path")

const SITEMAP_JSON = path.join(__dirname, "../public/sitemap.json")
const SOURCE_PAGE = path.join(__dirname, "../app/[[...permalink]]/page.tsx")
const APP_DIR = path.join(__dirname, "../app")

// Recursively extract all permalinks from sitemap, excluding file and link layouts
const extractPermalinks = (node, permalinks = []) => {
  // Skip file and link layouts - they don't need page files since they render empty fragments
  if (node.permalink && node.layout !== "file" && node.layout !== "link") {
    permalinks.push(node.permalink)
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      extractPermalinks(child, permalinks)
    })
  }

  return permalinks
}

const generatePages = async () => {
  try {
    // Read sitemap.json
    const sitemapContent = await fs.readFile(SITEMAP_JSON, "utf8")
    const sitemap = JSON.parse(sitemapContent)

    // Extract all permalinks
    const permalinks = extractPermalinks(sitemap)
    const uniquePermalinks = [...new Set(permalinks)].sort()

    console.log(`Found ${uniquePermalinks.length} unique permalinks\n`)

    let created = 0
    let skipped = 0

    // Process each permalink
    for (const permalink of uniquePermalinks) {
      // Convert permalink to directory path
      let targetDir = APP_DIR
      let targetFile

      if (permalink === "/") {
        targetFile = path.join(APP_DIR, "page.tsx")
      } else {
        // Remove leading slash and split by /
        const pathParts = permalink.replace(/^\//, "").split("/")

        // Build directory path
        for (const part of pathParts) {
          targetDir = path.join(targetDir, part)
        }

        targetFile = path.join(targetDir, "page.tsx")
      }

      // Create directory if it doesn't exist
      try {
        await fs.mkdir(targetDir, { recursive: true })
      } catch (error) {
        // Directory might already exist, that's fine
      }

      // Copy page.tsx if it doesn't exist
      try {
        await fs.access(targetFile)
        console.log(`Skipped (already exists): ${targetFile}`)
        skipped++
      } catch {
        // File doesn't exist, copy it
        await fs.copyFile(SOURCE_PAGE, targetFile)
        console.log(`Created: ${targetFile}`)
        created++
      }
    }

    console.log("\n========================================")
    console.log("Summary:")
    console.log(`  Total permalinks: ${uniquePermalinks.length}`)
    console.log(`  Created: ${created}`)
    console.log(`  Skipped: ${skipped}`)
    console.log("========================================")
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

generatePages()
