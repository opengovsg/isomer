import { describe, expect, it } from "vitest"

import { calculateCombinedScore } from "../calculateCombinedScore"

describe("calculateCombinedScore", () => {
  describe("normalized fuzzy score calculation", () => {
    it("should return 1 for normalized fuzzy score when raw score is 0", () => {
      const result = calculateCombinedScore({
        rawFuzzyScore: 0,
        maxFuzzyScore: 10,
        normalizedQuery: "test",
        normalizedTarget: "test",
      })
      
      // normalizedFuzzyScore = 1 - 0/10 = 1
      // overlapScore = 1 (exact match)
      // combinedScore = 1 * 0.6 + 1 * 0.4 = 1
      expect(result).toBe(1)
    })

    it("should return 0 for normalized fuzzy score when raw equals max", () => {
      const result = calculateCombinedScore({
        rawFuzzyScore: 10,
        maxFuzzyScore: 10,
        normalizedQuery: "test",
        normalizedTarget: "test",
      })

      // normalizedFuzzyScore = 1 - 10/10 = 0
      // overlapScore = 1 (exact match)
      // combinedScore = 0 * 0.6 + 1 * 0.4 = 0.4
      expect(result).toBe(0.4)
    })

    it("should return 0.5 for normalized fuzzy score when raw is half of max", () => {
      const result = calculateCombinedScore({
        rawFuzzyScore: 5,
        maxFuzzyScore: 10,
        normalizedQuery: "test",
        normalizedTarget: "test",
      })

      // normalizedFuzzyScore = 1 - 5/10 = 0.5
      // overlapScore = 1 (exact match)
      // combinedScore = 0.5 * 0.6 + 1 * 0.4 = 0.3 + 0.4 = 0.7
      expect(result).toBe(0.7)
    })
  })


  describe("weight distribution", () => {
    it("should weight fuzzy score at 60% and overlap at 40%", () => {
      // Perfect fuzzy (1.0), zero overlap
      const fuzzyOnly = calculateCombinedScore({
        rawFuzzyScore: 0,
        maxFuzzyScore: 10,
        normalizedQuery: "aaa",
        normalizedTarget: "bbb",
      })

      expect(fuzzyOnly).toBe(0.6) // 1 * 0.6 + 0 * 0.4

      // Zero fuzzy, perfect overlap
      const overlapOnly = calculateCombinedScore({
        rawFuzzyScore: 10,
        maxFuzzyScore: 10,
        normalizedQuery: "test",
        normalizedTarget: "test",
      })
      
      expect(overlapOnly).toBe(0.4) // 0 * 0.6 + 1 * 0.4
    })
  })
})

