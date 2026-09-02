import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { CollectionLinkProps } from "~/schemas/collection"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"

import type { CollectionShowThumbnail } from "../hooks/useCollectionShowThumbnail"
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
  showThumbnail: CollectionShowThumbnail
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
  showThumbnail,
  lastModified,
}: BuildCollectionLinkPreviewSitemapProps): IsomerSitemap => {
  const collectionPermalink = getCollectionPermalink(permalink)
  const collectionSegments = collectionPermalink.split("/").filter(Boolean)

  const collectionNode: IsomerSitemap = {
    id: "collection",
    permalink: collectionPermalink,
    lastModified,
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    title: collectionTitle,
    summary: "",
    collectionPagePageProps: { tagCategories, showThumbnail },
    children: [
      {
        id: "9999999",
        title,
        summary: link.description ?? "",
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Link,
        permalink,
        lastModified,
        ...link,
      },
    ],
  }

  // The collection index page resolves both its items and its breadcrumb by walking
  // the sitemap one permalink segment at a time from the root, so a node has to exist
  // at every prefix for it to reach a collection that sits inside folders.
  const ancestors = collectionSegments.slice(0, -1).map((segment, index) => ({
    permalink: `/${collectionSegments.slice(0, index + 1).join("/")}`,
    title: ancestorTitles[index] ?? segment,
  }))

  // Fold innermost-first, so the outermost ancestor ends up directly under the root.
  const node = ancestors.reduceRight<IsomerSitemap>(
    (child, ancestor, index) => ({
      id: `ancestor-${index}`,
      permalink: ancestor.permalink,
      lastModified,
      layout: ISOMER_USABLE_PAGE_LAYOUTS.Content,
      title: ancestor.title,
      summary: "",
      children: [child],
    }),
    collectionNode,
  )

  return {
    id: "root",
    permalink: "/",
    lastModified,
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Homepage,
    title: "An Isomer Site",
    summary: "",
    children: [node],
  }
}
