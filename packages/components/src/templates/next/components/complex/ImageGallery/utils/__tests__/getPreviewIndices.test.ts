import { describe, expect, it } from "vitest"

import { getPreviewIndices } from "../getPreviewIndices"

describe("getPreviewIndices", () => {
  describe("when maxPreviewImages is 3", () => {
    const maxPreviewImages = 3

    it("should return all indices when there are fewer than or equal to the maximum number of preview images", () => {
      const cases = [
        { currentIndex: 0, expected: [0], numberOfImages: 1 },
        { currentIndex: 1, expected: [0, 1, 2], numberOfImages: 3 },
        { currentIndex: 2, expected: [1, 2, 3], numberOfImages: 5 },
      ]

      for (const { numberOfImages, currentIndex, expected } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result).toEqual(expected)
      }
    })

    it("should center the current image with 2 images before it when possible", () => {
      const result = getPreviewIndices({
        // Current image is in the middle
        currentIndex: 5,
        maxPreviewImages,
        numberOfImages: 10,
      })

      // 1 before, current, 1 after
      expect(result).toEqual([4, 5, 6])
    })

    it("should handle edge cases with the current index at start or end", () => {
      const cases = [
        { currentIndex: 0, expected: [0, 1, 2], numberOfImages: 10 },
        { currentIndex: 9, expected: [7, 8, 9], numberOfImages: 10 },
      ]

      for (const { numberOfImages, currentIndex, expected } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result).toEqual(expected)
      }
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      const cases = [
        { currentIndex: 2, numberOfImages: 6 },
        { currentIndex: 5, numberOfImages: 10 },
        { currentIndex: 15, numberOfImages: 20 },
      ]

      for (const { numberOfImages, currentIndex } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result.length).toBe(maxPreviewImages)
      }
    })
  })

  describe("when maxPreviewImages is 5", () => {
    const maxPreviewImages = 5

    it("should return all indices when there are fewer than or equal to the maximum number of preview images", () => {
      const cases = [
        { currentIndex: 0, expected: [0], numberOfImages: 1 },
        { currentIndex: 1, expected: [0, 1, 2], numberOfImages: 3 },
        { currentIndex: 2, expected: [0, 1, 2, 3, 4], numberOfImages: 5 },
      ]

      for (const { numberOfImages, currentIndex, expected } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result).toEqual(expected)
      }
    })

    it("should center the current image with 2 images before it when possible", () => {
      const result = getPreviewIndices({
        // Current image is in the middle
        currentIndex: 5,
        maxPreviewImages,
        numberOfImages: 10,
      })

      // 2 before, current, 2 after
      expect(result).toEqual([3, 4, 5, 6, 7])
    })

    it("should adjust indices when close to the start", () => {
      const result = getPreviewIndices({
        // Current image is near the start
        currentIndex: 1,
        maxPreviewImages,
        numberOfImages: 10,
      })

      // Not enough room for 2 before
      expect(result).toEqual([0, 1, 2, 3, 4])
    })

    it("should adjust indices when close to the end", () => {
      const result = getPreviewIndices({
        // Current image is near the end
        currentIndex: 8,
        maxPreviewImages,
        numberOfImages: 10,
      })

      // Show last 5 images
      expect(result).toEqual([5, 6, 7, 8, 9])
    })

    it("should handle edge cases with the current index at start or end", () => {
      const cases = [
        { currentIndex: 0, expected: [0, 1, 2, 3, 4], numberOfImages: 10 },
        { currentIndex: 9, expected: [5, 6, 7, 8, 9], numberOfImages: 10 },
      ]

      for (const { numberOfImages, currentIndex, expected } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result).toEqual(expected)
      }
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      const cases = [
        { currentIndex: 2, numberOfImages: 6 },
        { currentIndex: 5, numberOfImages: 10 },
        { currentIndex: 15, numberOfImages: 20 },
      ]

      for (const { numberOfImages, currentIndex } of cases) {
        const result = getPreviewIndices({
          currentIndex,
          maxPreviewImages,
          numberOfImages,
        })
        expect(result.length).toBe(maxPreviewImages)
      }
    })
  })
})
