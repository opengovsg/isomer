import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionId: string
}

export const getCollectionParent = ({
  site,
  collectionId,
}: GetCollectionParentProps): IsomerCollectionPageSitemap | null => {
  const collectionParent = site.siteMapArray.find(
    (item) => item.id === collectionId && item.layout === "collection",
  )

  if (collectionParent) {
    return collectionParent as IsomerCollectionPageSitemap
  }

  // NOTE: Signal an error to the caller that no parent could be found
  // so that we can fail gracefully
  return null
}
