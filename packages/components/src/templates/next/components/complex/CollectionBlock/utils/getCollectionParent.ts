import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionId: string
  collectionPermalink?: string // only for sites hosted on Github
}

export const getCollectionParent = ({
  site,
  collectionId,
  collectionPermalink,
}: GetCollectionParentProps): IsomerCollectionPageSitemap | null => {
  const sitemapArray = getSitemapAsArray(site.siteMap)

  const collectionParent = sitemapArray.find(
    (item) =>
      (item.id === collectionId || item.permalink === collectionPermalink) &&
      item.layout === "collection",
  )

  if (collectionParent) {
    return collectionParent as IsomerCollectionPageSitemap
  }

  // NOTE: Signal an error to the caller that no parent could be found
  // so that we can fail gracefully
  return null
}
