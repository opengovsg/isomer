import { resetSitemapArrayCacheForTests } from "./sitemapArrayCache"
import { resetStringInputCacheForTests } from "./stringInputCache"

/** Clears module-level build caches (unit tests only). */
export const resetBuildCachesForTests = () => {
  resetStringInputCacheForTests()
  resetSitemapArrayCacheForTests()
}
