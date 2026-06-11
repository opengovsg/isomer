import { ResourceType } from "~generated/generatedEnums"

import type { PageResourceType } from "./constants"
import type { PageOnlySitemapEntry, Resource, SitemapEntry } from "./types"
import { FOLDER_RESOURCE_TYPES } from "./constants"
import { getResourceFirstImage } from "./utils/getResourceFirstImage"

// Unique identifier for pages of dangling directories
// Guaranteed to not be present in the database because we start from 1
export const DANGLING_DIRECTORY_PAGE_ID = "-1"
export const INDEX_PAGE_PERMALINK = "_index"
export const META_PERMALINK = "_meta"

// Wrapper function for debug logging
export function logDebug(message: string, ...optionalParams: any[]) {
  if (process.env.DEBUG === "true") {
    console.log(message, ...optionalParams)
  }
}

export const getConvertedPermalink = (fullPermalink: string) => {
  // NOTE: If the full permalink ends with `_index`,
  // we should remove it because this function
  // is called for generation of the permalink in the sitemap
  // and reflects what the users see.
  // Note that we can do an `endsWith` because
  // we prohibit users from using `_` as a character
  const fullPermalinkWithoutIndex = fullPermalink.endsWith(INDEX_PAGE_PERMALINK)
    ? fullPermalink.slice(0, -INDEX_PAGE_PERMALINK.length)
    : fullPermalink.endsWith(META_PERMALINK)
      ? fullPermalink.slice(0, -META_PERMALINK.length)
      : fullPermalink

  if (fullPermalinkWithoutIndex.endsWith("/")) {
    return fullPermalinkWithoutIndex.slice(0, -1)
  }

  return fullPermalinkWithoutIndex
}

// Build a single page-only sitemap entry from a resource. The caller has
// already established that the resource is a page with content. This is the
// pure projection of a resource row into a sitemap entry — file I/O and the
// `resource.content.page.title` mutation remain in the entry point.
export const buildPageSitemapEntry = (
  resources: Resource[],
  resource: Resource,
): PageOnlySitemapEntry => {
  // NOTE: We remap the ID for _index pages to be the ID of the folder,
  // as both will have the same permalink and the folder is recognized as
  // the parent of all the children resources
  const idOfFolder = resources.find(
    (item) =>
      resource.fullPermalink.endsWith(INDEX_PAGE_PERMALINK) &&
      resource.type !== "RootPage" &&
      item.fullPermalink === getConvertedPermalink(resource.fullPermalink),
  )?.id

  return {
    id: idOfFolder ?? resource.id,
    type: resource.type as PageResourceType,
    title: resource.title,
    permalink: `/${getConvertedPermalink(resource.fullPermalink)}`,
    lastModified: resource.updatedAt.toISOString(),
    layout: resource.content.layout || "content",
    summary:
      (Array.isArray(resource.content.page.contentPageHeader?.summary)
        ? resource.content.page.contentPageHeader.summary.join(" ")
        : resource.content.page.contentPageHeader?.summary) ||
      resource.content.page.articlePageHeader?.summary ||
      resource.content.page.subtitle ||
      resource.content.page.description ||
      "",
    category: resource.content.page.category,
    tags: resource.content.page.tags,
    tagged: resource.content.page.tagged,
    date: resource.content.page.date,
    image: resource.content.page.image,
    firstImage: getResourceFirstImage(resource),
    ref: resource.content.page.ref, // For file and link layouts
    collectionPagePageProps: {
      tagCategories: resource.content.page?.tagCategories,
      sortOrder: resource.content.page?.sortOrder,
      defaultSortBy: resource.content.page?.defaultSortBy,
      defaultSortDirection: resource.content.page?.defaultSortDirection,
      showThumbnail: resource.content.page?.showThumbnail,
    },
  }
}

export function generateSitemapTree(
  resources: Resource[],
  sitemapEntries: PageOnlySitemapEntry[],
  pathPrefix: string,
): SitemapEntry[] | undefined {
  const pathPrefixWithoutLeadingSlash = pathPrefix.slice(1)

  const entriesWithPathPrefix = sitemapEntries.filter(
    (entry) =>
      entry.permalink.startsWith(
        `${pathPrefix.length === 1 ? "" : pathPrefix}/`,
      ) && entry.permalink !== "/",
  )

  // Base case: No entries with the path prefix - this is a leaf node
  if (entriesWithPathPrefix.length === 0) {
    return undefined
  }

  // NOTE: Get the immediate children of the current path
  const childrenPaths = Array.from(
    new Set(
      entriesWithPathPrefix.map(
        (entry) =>
          entry.permalink
            .slice(
              // NOTE: This is either one or two based on whether it is the root.
              // This is because at this point, the path prefix would either be
              // `/`if root, or `/a/b/` if not root.
              // Hence, we have to remove the whole prefix based on whether it has
              // just a single `/`(the single `/` is both leading and trailing) or both leading and trailing `/`
              pathPrefixWithoutLeadingSlash.length +
                (pathPrefix.length === 1 ? 1 : 2),
            )
            .split("/")[0],
      ),
    ),
  )

  // Identify children paths that might be dangling directories
  const danglingDirectories: SitemapEntry[] = childrenPaths
    .filter(
      (childPath) =>
        sitemapEntries.some((entry) =>
          entry.permalink.startsWith(
            `${pathPrefix.length === 1 ? "" : pathPrefix}/${childPath}/`,
          ),
        ) &&
        !sitemapEntries.some(
          (entry) =>
            entry.permalink ===
            `${pathPrefix.length === 1 ? "" : pathPrefix}/${childPath}`,
        ),
    )
    .map((danglingDirectory) => {
      const pageName = danglingDirectory.replace(/-/g, " ")
      const generatedTitle =
        pageName.charAt(0).toUpperCase() + pageName.slice(1)

      const folder = resources.find(
        (resource) =>
          getConvertedPermalink(resource.fullPermalink) ===
            (pathPrefixWithoutLeadingSlash.length === 0
              ? danglingDirectory
              : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`) &&
          FOLDER_RESOURCE_TYPES.find((t) => t === resource.type),
      )
      const title = folder?.title ?? generatedTitle

      logDebug(
        `Creating index page for dangling directory: ${danglingDirectory}`,
      )
      logDebug(
        "Checking using permalink:",
        pathPrefixWithoutLeadingSlash.length === 0
          ? danglingDirectory
          : `${pathPrefixWithoutLeadingSlash}/${danglingDirectory}`,
      )

      return {
        id: folder?.id ?? DANGLING_DIRECTORY_PAGE_ID,
        title,
        permalink: `${pathPrefix.length === 1 ? "" : pathPrefix}/${danglingDirectory}`,
        lastModified: new Date().toISOString(),
        layout: folder?.type === "Collection" ? "collection" : "index",
        summary: `Pages in ${title}`,
        type: folder?.type ?? ResourceType.Folder,
      }
    })

  const existingChildren = entriesWithPathPrefix.filter(
    (entry) =>
      entry.permalink
        .slice(
          pathPrefixWithoutLeadingSlash.length +
            (pathPrefix.length === 1 ? 1 : 2),
        )
        .split("/").length === 1,
  )
  const children = [...existingChildren, ...danglingDirectories]

  // Get the page sorting order from the FolderMeta resource
  // TODO: delete this once `FolderMeta` is removed
  /** @deprecated use `pageOrderFromIndex` instead; we should remove this once `FolderMeta` is removed from db */
  const pageOrderFromMeta = resources.find(
    (resource) =>
      resource.type === "FolderMeta" &&
      resource.fullPermalink ===
        (pathPrefixWithoutLeadingSlash.length === 0
          ? META_PERMALINK
          : `${pathPrefixWithoutLeadingSlash}/${META_PERMALINK}`),
  )?.content?.order

  const pageOrderFromIndex = resources
    .find(
      (resource) =>
        resource.type === "IndexPage" &&
        resource.fullPermalink ===
          (pathPrefixWithoutLeadingSlash.length === 0
            ? INDEX_PAGE_PERMALINK
            : `${pathPrefixWithoutLeadingSlash}/${INDEX_PAGE_PERMALINK}`),
    )
    ?.content?.content?.find(
      ({ type }: { type: string }) => type === "childrenpages",
    )
    ?.childrenPagesOrdering?.map((id: string) => {
      const child = children.find(({ id: childId }) => {
        return id === childId
      })

      return child?.permalink.split("/").pop()
    })
    .filter((permalink: string | undefined) => !!permalink)

  const pageOrder = pageOrderFromIndex ?? pageOrderFromMeta

  children.sort((a, b) => {
    const aPermalink = a.permalink.split("/").pop()
    const bPermalink = b.permalink.split("/").pop()

    if (
      pageOrder === undefined ||
      pageOrder.indexOf(aPermalink) === pageOrder.indexOf(bPermalink)
    ) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    if (pageOrder.indexOf(aPermalink) === -1) {
      return 1
    }

    if (pageOrder.indexOf(bPermalink) === -1) {
      return -1
    }

    return pageOrder.indexOf(aPermalink) - pageOrder.indexOf(bPermalink)
  })

  return children.map((child) => ({
    ...child,
    children: generateSitemapTree(resources, sitemapEntries, child.permalink),
  }))
}

export function getFoldersAndCollections(
  resources: Resource[],
  sitemapEntry: SitemapEntry,
): SitemapEntry[] {
  // Base case: No children - this is a leaf node
  if (!sitemapEntry.children) {
    return []
  }

  // Get all immediate children that are folders
  const folders = sitemapEntry.children.filter((child) =>
    resources.some(
      (resource) =>
        resource.id === child.id &&
        FOLDER_RESOURCE_TYPES.find((t) => t === resource.type),
    ),
  )

  // Recurse on all children
  return [
    ...folders,
    ...sitemapEntry.children.flatMap((child) =>
      getFoldersAndCollections(resources, child),
    ),
  ]
}

// Pure decision for `processDanglingDirectories`: given the sitemap tree,
// compute the list of dangling-directory index pages that need to be written
// (permalink + content), without performing any file I/O. The caller writes
// each returned entry to disk. The line-430 `CollectionMeta` lookup quirk
// (`parentId === Number(id)`) is preserved verbatim — see plan decision 6.
export const getDanglingDirectoryIndexPages = (
  resources: Resource[],
  sitemapEntry: SitemapEntry,
  getFolderIndexPageContents: (title: string) => unknown,
  getCollectionIndexPageContents: (title: string, variant?: any) => unknown,
): { permalink: string; content: unknown }[] => {
  // Base case: No children - this is a leaf node
  if (!sitemapEntry.children) {
    return []
  }

  const directories = getFoldersAndCollections(resources, sitemapEntry)
  const folders = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Folder,
  )
  const collections = directories.filter(
    (siteMapEntry) => siteMapEntry.type === ResourceType.Collection,
  )

  return [
    ...folders.map(({ title, permalink }) => {
      const content = getFolderIndexPageContents(title)
      return { title, permalink, content }
    }),
    ...collections.map(({ id, title, permalink }) => {
      const meta = resources.find(
        ({ type, parentId }) =>
          parentId === Number(id) && type === "CollectionMeta",
      )
      const content = getCollectionIndexPageContents(
        title,
        meta?.content.variant,
      )
      return { title, permalink, content }
    }),
  ].map((child) => ({
    permalink: `${child.permalink}/${INDEX_PAGE_PERMALINK}`,
    content: child.content,
  }))
}
