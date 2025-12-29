import { describe, expect, it } from "vitest"

import { getWordJaccardSimilarity } from "../getWordJaccardSimilarity"

describe("getWordJaccardSimilarity", () => {
  describe("edge cases", () => {
    it("should return 1 when both query and target are empty", () => {
      expect(getWordJaccardSimilarity("", "")).toBe(1)
    })

    it("should return 0 when query is empty but target is not", () => {
      expect(getWordJaccardSimilarity("", "hello world")).toBe(0)
    })

    it("should return 0 when target is empty but query is not", () => {
      expect(getWordJaccardSimilarity("hello world", "")).toBe(0)
    })
  })

  describe("exact matches", () => {
    it("should return 1 for identical single word", () => {
      expect(getWordJaccardSimilarity("hello", "hello")).toBe(1)
    })

    it("should return 1 for identical multiple words", () => {
      expect(getWordJaccardSimilarity("hello world", "hello world")).toBe(1)
    })
  })

  describe("partial matches", () => {
    it("should return 0.5 when one of two words match", () => {
      expect(getWordJaccardSimilarity("hello", "hello world")).toBe(0.5)
    })

    it("should return correct Jaccard similarity for partial overlap", () => {
      // query: {a, b}, target: {b, c}
      // intersection: {b} = 1
      // union: {a, b, c} = 3
      // Jaccard = 1/3
      expect(getWordJaccardSimilarity("a b", "b c")).toBeCloseTo(1 / 3)
    })

    it("should handle larger sets correctly", () => {
      // query: {a, b, c}, target: {b, c, d, e}
      // intersection: {b, c} = 2
      // union: {a, b, c, d, e} = 5
      // Jaccard = 2/5
      expect(getWordJaccardSimilarity("a b c", "b c d e")).toBeCloseTo(2 / 5)
    })
  })

  describe("no matches", () => {
    it("should return 0 when no words overlap", () => {
      expect(getWordJaccardSimilarity("hello world", "foo bar")).toBe(0)
    })
  })

  describe("delimiter handling", () => {
    it("should split on spaces", () => {
      expect(getWordJaccardSimilarity("hello world", "hello world")).toBe(1)
    })

    it("should split on forward slashes", () => {
      expect(getWordJaccardSimilarity("docs/guide", "docs/guide")).toBe(1)
    })

    it("should handle mixed delimiters", () => {
      expect(getWordJaccardSimilarity("docs/guide page", "docs/guide page")).toBe(1)
    })

    it("should treat path segments as separate words", () => {
      // query: {docs, guide}, target: {docs, other}
      // intersection: {docs} = 1
      // union: {docs, guide, other} = 3
      expect(getWordJaccardSimilarity("docs/guide", "docs/other")).toBeCloseTo(1 / 3)
    })
  })

  describe("word order independence", () => {
    it("should return same score regardless of word order", () => {
      expect(getWordJaccardSimilarity("hello world", "world hello")).toBe(1)
    })

    it("should handle different orders with partial match", () => {
      expect(getWordJaccardSimilarity("a b c", "c b a")).toBe(1)
    })
  })

  describe("duplicate words", () => {
    it("should treat duplicate words as single occurrence", () => {
      // Sets deduplicate, so "hello hello" becomes {hello}
      expect(getWordJaccardSimilarity("hello hello", "hello")).toBe(1)
    })
  })
})

