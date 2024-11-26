import type { Exact } from "type-fest"

import type { CollectionPageSchemaType, IsomerSiteProps } from "~/engine"
import type { AllCardProps, ProcessedCollectionCardProps } from "~/interfaces"
import {
  getBreadcrumbFromSiteMap,
  getParsedDate,
  getReferenceLinkHref,
  getSitemapAsArray,
  isExternalUrl,
} from "~/utils"
import { Skeleton } from "../Skeleton"
import CollectionClient from "./CollectionClient"
import { getAvailableFilters, shouldShowDate } from "./utils"

const getCollectionItems = (
  site: IsomerSiteProps,
  permalink: string,
): AllCardProps[] => {
  let currSitemap = site.siteMap
  const permalinkParts = permalink.split("/")

  for (let i = 2; i <= permalinkParts.length; i++) {
    const currPermalink = permalinkParts.slice(0, i).join("/")

    if (!currSitemap.children) {
      return []
    }

    const child = currSitemap.children.find(
      (child) => child.permalink === currPermalink,
    )

    if (!child) {
      return []
    }

    currSitemap = child
  }

  if (!currSitemap.children) {
    return []
  }

  const items = currSitemap.children.flatMap((child) =>
    getSitemapAsArray(child),
  )

  const transformedItems = items
    .filter(
      (item) =>
        item.layout === "file" ||
        item.layout === "link" ||
        item.layout === "article",
    )
    .map((item) => {
      const date =
        item.date !== undefined ? getParsedDate(item.date) : undefined

      const baseItem = {
        type: "collectionCard" as const,
        rawDate: date,
        lastUpdated: date?.toISOString(),
        category: item.category || "Others",
        title: item.title,
        description: item.summary,
        image: item.image,
        site,
      }

      if (item.layout === "file") {
        return {
          ...baseItem,
          variant: "file",
          url: item.ref,
          fileDetails: item.fileDetails,
        }
      } else if (item.layout === "link") {
        return {
          ...baseItem,
          variant: "link",
          url: item.ref,
        }
      }

      return {
        ...baseItem,
        variant: "article",
        url: item.permalink,
      }
    }) satisfies AllCardProps[]

  return transformedItems.sort((a, b) => {
    // Sort by last updated date, tiebreaker by title
    if (a.rawDate === b.rawDate) {
      return a.title > b.title ? 1 : -1
    }

    // Rank items with no dates last
    if (a.rawDate === undefined) {
      return 1
    }

    if (b.rawDate === undefined) {
      return -1
    }

    return a.rawDate < b.rawDate ? 1 : -1
  }) as AllCardProps[]
}

const processedCollectionItems = (
  items: AllCardProps[],
): ProcessedCollectionCardProps[] => {
  return items.map((item) => {
    const {
      site,
      variant,
      lastUpdated,
      category,
      title,
      description,
      image,
      url,
    } = item
    const file = variant === "file" ? item.fileDetails : null
    return {
      lastUpdated,
      category,
      title,
      description,
      image,
      referenceLinkHref: getReferenceLinkHref(
        url,
        site.siteMap,
        site.assetsBaseUrl,
      ),
      imageSrc:
        isExternalUrl(item.image?.src) || site.assetsBaseUrl === undefined
          ? item.image?.src
          : `${site.assetsBaseUrl}${item.image?.src}`,
      itemTitle: `${item.title}${file ? ` [${file.type.toUpperCase()}, ${file.size.toUpperCase()}]` : ""}`,
    } as Exact<ProcessedCollectionCardProps, ProcessedCollectionCardProps>
  })
}

const CollectionLayout = ({
  site,
  page,
  layout,
  LinkComponent,
  ScriptComponent,
}: CollectionPageSchemaType) => {
  const { permalink } = page

  const items = getCollectionItems(site, permalink)
  const processedItems = processedCollectionItems(items)
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      <CollectionClient
        page={page}
        breadcrumb={breadcrumb}
        items={processedItems}
        filters={getAvailableFilters(processedItems)}
        shouldShowDate={shouldShowDate(processedItems)}
        siteAssetsBaseUrl={site.assetsBaseUrl}
        LinkComponent={LinkComponent}
      />
    </Skeleton>
  )
}

export default CollectionLayout
