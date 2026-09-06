import type { CollectionPageSchemaType } from "~/types"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"

import { Skeleton } from "../Skeleton"
import { CollectionClient } from "./CollectionClient"
import { getAvailableFilters } from "./utils/getAvailableFilters"
import { getCollectionItems } from "./utils/getCollectionItems"
import { processCollectionItems } from "./utils/processCollectionItems"
import { shouldShowDate } from "./utils/shouldShowDate"

export const CollectionLayout = ({
  site,
  page,
  layout,
}: CollectionPageSchemaType) => {
  const {
    permalink,
    sortOrder,
    defaultSortBy,
    defaultSortDirection,
    tagCategories,
    showDate,
    showThumbnail,
  } = page

  const items = getCollectionItems({
    permalink,
    showDate,
    showThumbnail,
    site,
    sortBy: defaultSortBy,
    sortDirection: defaultSortDirection,
    sortOrder,
    tagCategories,
  })
  const processedItems = processCollectionItems(items)
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  return (
    <Skeleton site={site} page={page} layout={layout}>
      <CollectionClient
        page={page}
        breadcrumb={breadcrumb}
        items={processedItems}
        filters={getAvailableFilters(processedItems, tagCategories)}
        shouldShowDate={shouldShowDate(processedItems)}
        siteAssetsBaseUrl={site.assetsBaseUrl}
      />
    </Skeleton>
  )
}
