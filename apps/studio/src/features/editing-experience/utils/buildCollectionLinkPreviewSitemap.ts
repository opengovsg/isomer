import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { CollectionLinkProps } from "~/schemas/collection"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

interface BuildCollectionLinkPreviewSitemapProps {
  /** Full permalink of the link being edited, e.g. `/resources/circulars/my-link`. */
  permalink: string
  title: string
  link: CollectionLinkProps
  collectionTitle: string
  /** Titles of the folders between the site root and the collection, root-first. */
  ancestorTitles: string[]
  tagCategories: CollectionTags | undefined
  lastModified: string
}

// The permalink of the collection a link belongs to. Must stay in step with the
// collection node's permalink in the sitemap below, or the preview renders a page
// that no node matches.
export const getCollectionPermalink = (linkPermalink: string): string =>
  linkPermalink.split("/").slice(0, -1).join("/")

// A collection link has no page of its own — it only ever renders as a card in its
// parent collection's index page. So the preview renders that collection index page
// against a stand-in sitemap containing just the link being edited.
export const buildCollectionLinkPreviewSitemap = ({
  permalink,
  title,
  link,
  collectionTitle,
  ancestorTitles,
  tagCategories,
  lastModified,
}: BuildCollectionLinkPreviewSitemapProps): IsomerSitemap => {
  const collectionPermalink = getCollectionPermalink(permalink)
  const collectionSegments = collectionPermalink.split("/").filter(Boolean)

  const collectionNode: IsomerSitemap = {
    children: [
      {
        id: "9999999",
        lastModified,
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Link,
        permalink,
        summary: link.description ?? "",
        title,
        ...link,
      },
    ],
    collectionPagePageProps: { tagCategories },
    id: "collection",
    lastModified,
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    permalink: collectionPermalink,
    summary: "",
    title: collectionTitle,
  }

  // The collection index page resolves both its items and its breadcrumb by walking
  // the sitemap one permalink segment at a time from the root, so a node has to exist
  // at every prefix for it to reach a collection that sits inside folders.
  const ancestors = collectionSegments.slice(0, -1).map((segment, index) => ({
    permalink: `/${collectionSegments.slice(0, index + 1).join("/")}`,
    title: ancestorTitles[index] ?? segment,
  }))

  // Fold innermost-first, so the outermost ancestor ends up directly under the root.
  // oxlint-disable-next-line unicorn/no-array-reduce -- core cleanup deferred
  const node = ancestors.reduceRight<IsomerSitemap>(
    (child, ancestor, index) => ({
      children: [child],
      id: `ancestor-${index}`,
      lastModified,
      layout: ISOMER_USABLE_PAGE_LAYOUTS.Content,
      permalink: ancestor.permalink,
      summary: "",
      title: ancestor.title,
    }),
    collectionNode,
  )

  return {
    children: [node],
    id: "root",
    lastModified,
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Homepage,
    permalink: "/",
    summary: "",
    title: "An Isomer Site",
  }
}
