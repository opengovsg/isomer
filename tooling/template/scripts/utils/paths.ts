import path from "node:path"

export const PAGE_FILE_NAME = "page.tsx"

/**
 * Get the permalink array from a page.tsx file path relative to appDir.
 * e.g. app/contact/page.tsx -> ["contact"], app/page.tsx -> []
 */
export function getPermalinkFromPath(
  filePath: string,
  appDir: string,
  pageFileName: string = PAGE_FILE_NAME,
): string[] {
  const relativePath = path.relative(appDir, filePath)

  if (relativePath === pageFileName) {
    return []
  }

  const escaped = pageFileName.replace(/\./g, "\\.")
  const routePath = relativePath
    .replace(new RegExp(`/${escaped}$`), "")
    .replace(/\\/g, "/")

  if (routePath === "") {
    return []
  }

  return routePath.split("/").filter(Boolean)
}

/**
 * Get the route path from a page.tsx file path (e.g. "/contact", "/").
 */
export function getRouteFromPath(
  filePath: string,
  appDir: string,
  pageFileName: string = PAGE_FILE_NAME,
): string {
  const relativePath = path.relative(appDir, filePath)
  const escaped = pageFileName.replace(/\./g, "\\.")
  let routePath = relativePath
    .replace(new RegExp(`/?${escaped}$`), "")
    .replace(/\\/g, "/")
  routePath = routePath.replace(/\/+$/, "")
  return routePath === "" ? "/" : "/" + routePath
}
