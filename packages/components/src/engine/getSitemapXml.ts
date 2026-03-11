import type { IsomerSitemap } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

export const getSitemapXml = (sitemap: IsomerSitemap, siteUrl?: string) => {
  return getSitemapAsArray(sitemap)
    .filter(
      (item) =>
        item.layout !== ISOMER_PAGE_LAYOUTS.File &&
        item.layout !== ISOMER_PAGE_LAYOUTS.Link,
    )
    .map(({ permalink, lastModified }) => {
      const permalinkWithTrailingSlash = permalink.endsWith("/")
        ? permalink
        : `${permalink}/`

      return {
        url:
          siteUrl !== undefined
            ? `${siteUrl}${permalinkWithTrailingSlash}`
            : permalinkWithTrailingSlash,
        lastModified,
      }
    })
}
