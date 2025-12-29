import createFuzzySearch from "@nozbe/microfuzz"

import { getWordJaccardSimilarity } from "./getWordJaccardSimilarity"
import { normalizePermalink } from "./normalizeUrl"

interface GetSimilarSitemapMatchesOptions {
  sitemap: {
    permalink: string
    title: string
  }[]
  query: string
  numberOfResults?: number
}

interface IndexedEntity {
  text: string
  entity: GetSimilarSitemapMatchesOptions["sitemap"][number]
}

// Minimum word overlap required for fallback matching
const MIN_JACCARD_THRESHOLD = 0.2

export const getSimilarSitemapMatches = ({
  sitemap,
  query,
  numberOfResults = 3,
}: GetSimilarSitemapMatchesOptions) => {
  const normalizedQuery = normalizePermalink(query)

  // Return empty if query is empty after normalization
  if (!normalizedQuery) {
    return []
  }

  const indexed = sitemap.map((entity) => ({
    text: normalizePermalink(entity.permalink),
    entity,
  }))

  const searchFunction = createFuzzySearch(indexed, {
    getText: (entity: IndexedEntity) => [entity.text],
  })

  // Get fuzzy results - microfuzz already ranks by match quality (lower score = better match)
  const fuzzyResults = searchFunction(normalizedQuery).slice(0, numberOfResults)

  // If fuzzy search found results, return them directly
  if (fuzzyResults.length > 0) {
    return fuzzyResults
  }

  // Fallback: use pure word-based matching when fuzzy search returns no results
  // This handles cases where the query contains characters not present in any target
  return indexed
    .filter((item) => item.text.length > 0) // Skip empty permalinks (e.g., homepage "/")
    .map((item) => ({
      item,
      score: 0, // No fuzzy score available
      matches: null,
      jaccardScore: getWordJaccardSimilarity(normalizedQuery, item.text),
    }))
    .filter((result) => result.jaccardScore >= MIN_JACCARD_THRESHOLD)
    .sort((a, b) => b.jaccardScore - a.jaccardScore)
    .slice(0, numberOfResults)
}
