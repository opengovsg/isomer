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
  const schemaRoot = path.resolve(schemaDir)

  if (permalink === "/") {
    const schemaPath = path.join(schemaRoot, `${indexPagePermalink}.json`)
    const resolvedSchemaPath = path.resolve(schemaPath)
    // Defensive: ensure path stays under schemaDir (sitemap is DB-controlled; good practice only).
    if (
      resolvedSchemaPath !== schemaRoot &&
      !resolvedSchemaPath.startsWith(`${schemaRoot}${path.sep}`)
    ) {
      throw new Error(
        `Resolved index schema path escapes schemaDir for permalink "${permalink}"`,
      )
    }

    return resolvedSchemaPath
  }

  const permalinkWithoutSlash = permalink.replace(/^\//, "")

  const segments = permalinkWithoutSlash.split("/")

  // Defensive guard against path traversal via malformed segments. This should not
  // happen in practice since we control the sitemap from the database; good practice only.
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`Invalid schema permalink path segments: "${permalink}"`)
  }

  const schemaPath = path.join(schemaRoot, `${permalinkWithoutSlash}.json`)
  const resolvedSchemaPath = path.resolve(schemaPath)
  // Ensure resolved path stays under schemaDir (same rationale as above).
  if (
    resolvedSchemaPath !== schemaRoot &&
    !resolvedSchemaPath.startsWith(`${schemaRoot}${path.sep}`)
  ) {
    throw new Error(
      `Resolved schema path escapes schemaDir for permalink "${permalink}"`,
    )
  }

  return resolvedSchemaPath
}
