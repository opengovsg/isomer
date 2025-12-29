import createFuzzySearch from "@nozbe/microfuzz"

import { normalizePermalink } from "./normalizeUrl"

interface GetFuzzySitemapMatchesOptions {
  sitemap: {
    permalink: string
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
    text: normalizePermalink(entity.permalink),
    entity,
  }))

  const searchFunction = createFuzzySearch(indexed, {
    getText: (entity: IndexedEntity) => [entity.text],
  })

  return searchFunction(normalizePermalink(query)).slice(0, numberOfResults)
}
