import type { Exact } from "type-fest"

import type { CollectionPageSchemaType } from "~/engine"
import type { AllCardProps, ProcessedCollectionCardProps } from "~/interfaces"
import {
  getBreadcrumbFromSiteMap,
  getReferenceLinkHref,
  isExternalUrl,
} from "~/utils"
import { Skeleton } from "../Skeleton"
import CollectionClient from "./CollectionClient"
import {
  getAvailableFilters,
  getCollectionItems,
  shouldShowDate,
} from "./utils"

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
      tags,
    } = item
    const file = variant === "file" ? item.fileDetails : null
    return {
      lastUpdated,
      category,
      title,
      description,
      image,
      tags,
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
