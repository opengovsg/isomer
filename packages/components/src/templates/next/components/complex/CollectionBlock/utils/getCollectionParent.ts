import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionId: string
}

export const getCollectionParent = ({
  site,
  collectionId,
}: GetCollectionParentProps): IsomerCollectionPageSitemap => {
  const items = site.siteMap.children?.flatMap((child) =>
    getSitemapAsArray(child),
  )

  const collectionParent = items?.find(
    (item) => item.id === collectionId && item.layout === "collection",
  )

  if (collectionParent) {
    return collectionParent as IsomerCollectionPageSitemap
  }

  throw new Error(
    `CollectionBlock: No collection parent found for collection ID ${collectionId}`,
  )
}
