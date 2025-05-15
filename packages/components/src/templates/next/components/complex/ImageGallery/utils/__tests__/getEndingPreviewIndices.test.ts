import { describe, expect, it } from "vitest"

import { getEndingPreviewIndices } from "../getEndingPreviewIndices"

describe("getEndingPreviewIndices", () => {
  describe("when maxPreviewImages is 3", () => {
    const maxPreviewImages = 3

    it("should return all indices when there are fewer than or equal to the maximum number of preview images", () => {
      // Arrange
      const cases = [
        { numberOfImages: 0, expected: [] },
        { numberOfImages: 1, expected: [0] },
        { numberOfImages: 2, expected: [0, 1] },
        { numberOfImages: 3, expected: [0, 1, 2] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, expected }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should return the last N indices when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 5, expected: [2, 3, 4] },
        { numberOfImages: 10, expected: [7, 8, 9] },
        { numberOfImages: 20, expected: [17, 18, 19] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, expected }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 4 },
        { numberOfImages: 10 },
        { numberOfImages: 20 },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result.length).toBe(maxPreviewImages)
      })
    })
  })

  describe("when maxPreviewImages is 5", () => {
    const maxPreviewImages = 5

    it("should return all indices when there are fewer than or equal to the maximum number of preview images", () => {
      // Arrange
      const cases = [
        { numberOfImages: 0, expected: [] },
        { numberOfImages: 1, expected: [0] },
        { numberOfImages: 3, expected: [0, 1, 2] },
        { numberOfImages: 5, expected: [0, 1, 2, 3, 4] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, expected }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should return the last N indices when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 7, expected: [2, 3, 4, 5, 6] },
        { numberOfImages: 10, expected: [5, 6, 7, 8, 9] },
        { numberOfImages: 20, expected: [15, 16, 17, 18, 19] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, expected }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 6 },
        { numberOfImages: 10 },
        { numberOfImages: 20 },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages }) => {
        const result = getEndingPreviewIndices({
          numberOfImages,
          maxPreviewImages,
        })
        expect(result.length).toBe(maxPreviewImages)
      })
    })
  })
})
