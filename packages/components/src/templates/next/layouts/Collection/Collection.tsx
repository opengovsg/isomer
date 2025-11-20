import type { CollectionPageSchemaType } from "~/types/schema"
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
  LinkComponent,
}: CollectionPageSchemaType) => {
  const { permalink, defaultSortBy, defaultSortDirection, tagCategories } = page

  const items = getCollectionItems({
    site,
    permalink,
    sortBy: defaultSortBy,
    sortDirection: defaultSortDirection,
    tagCategories,
  })
  const processedItems = processCollectionItems(items)
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
    >
      <CollectionClient
        page={page}
        breadcrumb={breadcrumb}
        items={processedItems}
        filters={getAvailableFilters(processedItems, tagCategories)}
        shouldShowDate={shouldShowDate(processedItems)}
        siteAssetsBaseUrl={site.assetsBaseUrl}
        LinkComponent={LinkComponent}
      />
    </Skeleton>
  )
}
