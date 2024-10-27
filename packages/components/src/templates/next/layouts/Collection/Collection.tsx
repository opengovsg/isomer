import type { CollectionPageSchemaType, IsomerSiteProps } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import { ISOMER_PAGE_LAYOUTS } from "~/engine"
import {
  getBreadcrumbFromSiteMap,
  getParsedDate,
  getSitemapAsArray,
} from "~/utils"
import { Skeleton } from "../Skeleton"
import CollectionClient from "./CollectionClient"
import { getAvailableFilters, shouldShowDate } from "./utils"

const getCollectionItems = (
  site: IsomerSiteProps,
  permalink: string,
): CollectionCardProps[] => {
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
        item.layout === ISOMER_PAGE_LAYOUTS.File ||
        item.layout === ISOMER_PAGE_LAYOUTS.Link ||
        item.layout === ISOMER_PAGE_LAYOUTS.Article,
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

      switch (item.layout) {
        case ISOMER_PAGE_LAYOUTS.File: {
          return {
            ...baseItem,
            variant: ISOMER_PAGE_LAYOUTS.File,
            url: item.ref,
            fileDetails: item.fileDetails,
          }
        }
        case ISOMER_PAGE_LAYOUTS.Link: {
          return {
            ...baseItem,
            variant: ISOMER_PAGE_LAYOUTS.Link,
            url: item.ref,
          }
        }
        default: {
          return {
            ...baseItem,
            variant: ISOMER_PAGE_LAYOUTS.Article,
            url: item.permalink,
          }
        }
      }
    }) satisfies CollectionCardProps[]

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
  }) as CollectionCardProps[]
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
        items={items}
        filters={getAvailableFilters(items)}
        shouldShowDate={shouldShowDate(items)}
        LinkComponent={LinkComponent}
        site={site}
      />
    </Skeleton>
  )
}

export default CollectionLayout
