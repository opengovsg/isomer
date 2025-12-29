import createFuzzySearch from "@nozbe/microfuzz"

import { calculateCombinedScore } from "./calculateCombinedScore"
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
  const normalizedQuery = normalizePermalink(query)

  const indexed = sitemap.map((entity) => ({
    text: normalizePermalink(entity.permalink),
    entity,
  }))

  const searchFunction = createFuzzySearch(indexed, {
    getText: (entity: IndexedEntity) => [entity.text],
  })

  // Get more results than needed for re-ranking
  const fuzzyResults = searchFunction(normalizedQuery).slice(
    0,
    numberOfResults * 2,
  )

  // Find max fuzzy score for normalization
  const maxFuzzyScore = Math.max(...fuzzyResults.map((r) => r.score), 1)

  // Calculate combined scores and re-rank
  return fuzzyResults
    .map((result) => {
      const combinedScore = calculateCombinedScore({
        rawFuzzyScore: result.score,
        maxFuzzyScore,
        normalizedQuery,
        normalizedTarget: result.item.text,
      });
      return { ...result, combinedScore };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore) // Sort by combined score (higher is better)
    .slice(0, numberOfResults)
}
