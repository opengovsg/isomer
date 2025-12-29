/**
 * Calculate word overlap score using Jaccard similarity
 * Returns intersection / union of query and target words
 * This penalizes both missing words AND extra words
 */
export const getWordJaccardSimilarity = (query: string, target: string) => {
  const queryWords = new Set(query.split(/[\s\/]+/).filter(Boolean))
  const targetWords = new Set(target.split(/[\s\/]+/).filter(Boolean))

  if (queryWords.size === 0 && targetWords.size === 0) return 1
  if (queryWords.size === 0 || targetWords.size === 0) return 0

  let intersectionSize = 0
  for (const word of queryWords) {
    if (targetWords.has(word)) {
      intersectionSize++
    }
  }

  const unionSize = new Set([...queryWords, ...targetWords]).size

  return intersectionSize / unionSize
}

