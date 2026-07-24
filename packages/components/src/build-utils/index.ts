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
