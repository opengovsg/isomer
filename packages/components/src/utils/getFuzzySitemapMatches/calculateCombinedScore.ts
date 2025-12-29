import { getWordJaccardSimilarity } from "./getWordJaccardSimilarity"

// Weight for combining fuzzy score and word overlap score
// Higher fuzzy weight = prefer character-level matching
// Higher overlap weight = prefer word presence matching
const FUZZY_WEIGHT = 0.6
const OVERLAP_WEIGHT = 0.4

interface CalculateCombinedScoreParams {
  rawFuzzyScore: number
  maxFuzzyScore: number
  normalizedQuery: string
  normalizedTarget: string
}

/**
 * Calculates a combined score from fuzzy matching and word overlap.
 * - Fuzzy score is normalized to 0-1 range (higher = better match)
 * - Word overlap uses Jaccard similarity
 * - Combined score weighs both factors
 */
export const calculateCombinedScore = ({
  rawFuzzyScore,
  maxFuzzyScore,
  normalizedQuery,
  normalizedTarget,
}: CalculateCombinedScoreParams) => {
  // microfuzz score is a distance (lower = better match)
  // Normalize to 0-1 range where higher = better: 1 - (score / maxScore)
  const normalizedFuzzyScore = 1 - rawFuzzyScore / maxFuzzyScore

  const overlapScore = getWordJaccardSimilarity(normalizedQuery, normalizedTarget)

  // Combined score (higher is better)
  return (normalizedFuzzyScore * FUZZY_WEIGHT) + (overlapScore * OVERLAP_WEIGHT)
}

