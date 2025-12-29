import createFuzzySearch from "@nozbe/microfuzz"

import { normalizeUrl } from "./normalizeUrl"

interface GetFuzzySitemapMatchesOptions {
  sitemap: {
    url: string
    title: string
  }[]
  query: string
  numberOfResults?: number
}

interface IndexedEntity {
  text: string
  entity: GetFuzzySitemapMatchesOptions["sitemap"][number]
}

export const getFuzzySitemapMatches = ({
  sitemap,
  query,
  numberOfResults = 5,
}: GetFuzzySitemapMatchesOptions) => {
  const indexed = sitemap.map((entity) => ({
    text: normalizeUrl(entity.url),
    entity,
  }))

  const searchFunction = createFuzzySearch(indexed, {
    getText: (entity: IndexedEntity) => [entity.text],
  })

  return searchFunction(normalizeUrl(query)).slice(0, numberOfResults)
}
