import type { IsomerSitemap } from "~/types"

let sitemapArrayByRoot = new WeakMap<IsomerSitemap, IsomerSitemap[]>()

export const getCachedSitemapArray = (
  sitemap: IsomerSitemap,
  flatten: (node: IsomerSitemap) => IsomerSitemap[],
): IsomerSitemap[] => {
  const cached = sitemapArrayByRoot.get(sitemap)
  if (cached) {
    return cached
  }

  const result = flatten(sitemap)
  sitemapArrayByRoot.set(sitemap, result)
  return result
}

/** @internal Test helper */
export const resetSitemapArrayCacheForTests = () => {
  sitemapArrayByRoot = new WeakMap()
}
