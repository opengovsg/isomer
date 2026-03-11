import path from "node:path"

export const INDEX_PAGE_PERMALINK = "_index"

/**
 * Get schema file path for a permalink given schemaDir.
 */
export function getSchemaPath(
  permalink: string,
  schemaDir: string,
  indexPagePermalink: string = INDEX_PAGE_PERMALINK,
): string {
  if (permalink === "/") {
    return path.join(schemaDir, `${indexPagePermalink}.json`)
  }

  const permalinkWithoutSlash = permalink.replace(/^\//, "")
  return path.join(schemaDir, `${permalinkWithoutSlash}.json`)
}
