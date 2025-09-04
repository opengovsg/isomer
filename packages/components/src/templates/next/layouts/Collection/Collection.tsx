import type { CollectionPageSchemaType } from "~/engine"
import { getBreadcrumbFromSiteMap } from "~/utils"
import { Skeleton } from "../Skeleton"
import CollectionClient from "./CollectionClient"
import {
  getAvailableFilters,
  getCollectionItems,
  processCollectionItems,
  shouldShowDate,
} from "./utils"

const CollectionLayout = ({
  site,
  page,
  layout,
  LinkComponent,
  ScriptComponent,
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
