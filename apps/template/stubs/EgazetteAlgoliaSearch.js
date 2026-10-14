// Build-time replacement for `@opengovsg/isomer-components`'s
// `templates/next/layouts/Search/EgazetteAlgoliaSearch`, swapped in by
// next.config.mjs when the site's search config isn't `egazette-algolia`.
// Keeps `algoliasearch`/`react-instantsearch` out of the client bundle.
export function EgazetteAlgoliaSearch() {
  return null
}
