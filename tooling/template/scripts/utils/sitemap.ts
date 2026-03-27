import path from "node:path"

export type SitemapNode = {
  permalink?: string
  layout?: string
  children?: SitemapNode[]
}

export type ExtractedPage = {
  permalink: string
  layout: string
}

/**
 * Extract permalinks from sitemap for page generation (excludes file/link layouts).
 */
export function extractPermalinks(
  node: SitemapNode,
  permalinks: string[] = [],
): string[] {
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

/**
 * Extract all pages from sitemap (permalink + layout) for analysis.
 */
export function extractPages(
  node: SitemapNode,
  pages: ExtractedPage[] = [],
): ExtractedPage[] {
  if (node.permalink) {
    pages.push({
      permalink: node.permalink,
      layout: node.layout ?? "",
    })
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      extractPages(child, pages)
    })
  }

  return pages
}

/**
 * Convert a permalink to target directory and page file path under appDir.
 */
export function permalinkToTargetPath(
  permalink: string,
  appDir: string,
): { targetDir: string; targetFile: string } {
  const appRoot = path.resolve(appDir)

  if (permalink === "/") {
    return {
      targetDir: appRoot,
      targetFile: path.join(appRoot, "page.tsx"),
    }
  }

  const pathParts = permalink.replace(/^\//, "").split("/")

  // Defensive guard against path traversal or malformed segments. This should not
  // happen in practice since we control the sitemap from the database; good practice only.
  if (
    pathParts.length === 0 ||
    pathParts.some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`Invalid permalink path segments: "${permalink}"`)
  }

  let targetDir = appRoot
  for (const part of pathParts) {
    targetDir = path.join(targetDir, part)
  }

  const resolvedTargetDir = path.resolve(targetDir)
  // Ensure resolved path stays under appDir (same rationale as above).
  if (
    resolvedTargetDir !== appRoot &&
    !resolvedTargetDir.startsWith(`${appRoot}${path.sep}`)
  ) {
    throw new Error(
      `Resolved target directory escapes appDir for permalink "${permalink}"`,
    )
  }

  return {
    targetDir: resolvedTargetDir,
    targetFile: path.join(resolvedTargetDir, "page.tsx"),
  }
}
