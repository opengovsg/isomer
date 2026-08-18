// React-free entrypoint for build-time consumers (e.g. the RSS feed generator).
// Importing the package root (or `./engine`) pulls in React components, which
// breaks under a plain Node/tsx script. This subpath re-exports only the pure
// utilities the static-site build needs, via direct module paths so the runtime
// graph never reaches a React module.
export {
  getCollectionItems,
  type GetCollectionItemsProps,
} from "~/templates/next/layouts/Collection/utils/getCollectionItems"
export { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
export { getSitemapAsArray } from "~/utils/getSitemapAsArray"
// The types build scripts need alongside the utilities above. Taking them from
// the package root instead would make `tsc` traverse the React barrel, even
// though the imports are type-only. `IsomerCollectionPageSitemap` is not
// exported from the root at all.
export type {
  IsomerCollectionPageSitemap,
  IsomerSitemap,
} from "~/types/sitemap"
export type { IsomerSiteProps } from "~/types/site"
