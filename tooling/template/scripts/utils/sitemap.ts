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
  if (permalink === "/") {
    return {
      targetDir: appDir,
      targetFile: path.join(appDir, "page.tsx"),
    }
  }

  const pathParts = permalink.replace(/^\//, "").split("/")
  let targetDir = appDir
  for (const part of pathParts) {
    targetDir = path.join(targetDir, part)
  }
  return {
    targetDir,
    targetFile: path.join(targetDir, "page.tsx"),
  }
}
