import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { SitemapAnalysis } from "./utils/analysis"
import type { SitemapNode } from "./utils/sitemap"
import { extractComponents } from "./utils/analysis"
import { getSchemaPath, INDEX_PAGE_PERMALINK } from "./utils/schema"
import { extractPages } from "./utils/sitemap"

function getBaseDir(): string {
  return process.env.TEMPLATE_BASE_DIR ?? path.join(__dirname, "..")
}

type SchemaJson = {
  layout?: string
  content?: unknown
}

const readSchema = async (
  permalink: string,
  schemaDir: string,
): Promise<SchemaJson | null> => {
  const schemaPath = getSchemaPath(permalink, schemaDir)

  try {
    const content = await fs.readFile(schemaPath, "utf8")
    return JSON.parse(content) as SchemaJson
  } catch {
    if (permalink === "/") {
      return null
    }

    try {
      const permalinkWithoutSlash = permalink.replace(/^\//, "")
      const indexSchemaPath = path.join(
        schemaDir,
        permalinkWithoutSlash,
        `${INDEX_PAGE_PERMALINK}.json`,
      )
      const content = await fs.readFile(indexSchemaPath, "utf8")
      return JSON.parse(content) as SchemaJson
    } catch {
      return null
    }
  }
}

const analyzePage = async (
  permalink: string,
  layout: string,
  schemaDir: string,
) => {
  const schema = await readSchema(permalink, schemaDir)

  if (!schema) {
    return {
      permalink,
      layout,
      components: [] as string[],
    }
  }

  const resolvedLayout = schema.layout || layout
  const components = extractComponents(schema.content)

  if (resolvedLayout === "index" && !components.includes("childrenpages")) {
    components.push("childrenpages")
  }

  return {
    permalink,
    layout: resolvedLayout,
    components,
  }
}

export async function run(baseDir?: string): Promise<void> {
  const base = baseDir ?? getBaseDir()
  const sitemapJson = path.join(base, "public", "sitemap.json")
  const schemaDir = path.join(base, "schema")
  const outputFile = path.join(base, "sitemap-analysis.json")

  const sitemapContent = await fs.readFile(sitemapJson, "utf8")
  const sitemap = JSON.parse(sitemapContent) as SitemapNode

  const pages = extractPages(sitemap)
  const output: SitemapAnalysis = {}

  for (const page of pages) {
    const result = await analyzePage(page.permalink, page.layout, schemaDir)

    output[result.permalink] = {
      layout: result.layout,
      components: result.components,
    }
  }

  await fs.writeFile(outputFile, JSON.stringify(output, null, 2), "utf8")
}

const main = async () => {
  try {
    await run()
  } catch (error) {
    const err = error as Error
    console.error("Error:", err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntry) main()
