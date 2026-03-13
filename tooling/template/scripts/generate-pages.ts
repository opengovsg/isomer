import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { SitemapNode } from "./utils/sitemap"
import { extractPermalinks, permalinkToTargetPath } from "./utils/sitemap"

function getBaseDir(): string {
  return process.env.TEMPLATE_BASE_DIR ?? path.join(__dirname, "..")
}

export async function run(baseDir?: string): Promise<void> {
  const base = baseDir ?? getBaseDir()
  const sitemapJson = path.join(base, "public", "sitemap.json")
  const sourcePage = path.join(base, "app", "page.tsx")
  const appDir = path.join(base, "app")

  const sitemapContent = await fs.readFile(sitemapJson, "utf8")
  const sitemap = JSON.parse(sitemapContent) as SitemapNode

  const permalinks = extractPermalinks(sitemap)
  const uniquePermalinks = [...new Set(permalinks)].sort()

  for (const permalink of uniquePermalinks) {
    const { targetDir, targetFile } = permalinkToTargetPath(permalink, appDir)

    try {
      await fs.mkdir(targetDir, { recursive: true })
    } catch {
      // Directory might already exist, that's fine
    }

    try {
      await fs.access(targetFile)
    } catch {
      await fs.copyFile(sourcePage, targetFile)
    }
  }
}

const main = async () => {
  try {
    await run()
  } catch (error) {
    const err = error as Error
    console.error("Error:", err.message)
    process.exit(1)
  }
}

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntry) main()
