import { describe, expect, it } from "vitest"

import { getPreviewIndices } from "../getPreviewIndices"

describe("getPreviewIndices", () => {
  describe("when maxPreviewImages is 3", () => {
    const maxPreviewImages = 3

    it("should return all indices when there are fewer than or equal to the maximum number of preview images", () => {
      // Arrange
      const cases = [
        { numberOfImages: 1, currentIndex: 0, expected: [0] },
        { numberOfImages: 3, currentIndex: 1, expected: [0, 1, 2] },
        { numberOfImages: 5, currentIndex: 2, expected: [1, 2, 3] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex, expected }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should center the current image with 2 images before it when possible", () => {
      // Act
      const result = getPreviewIndices({
        numberOfImages: 10,
        currentIndex: 5, // Current image is in the middle
        maxPreviewImages,
      })

      // Assert
      expect(result).toEqual([4, 5, 6]) // 1 before, current, 1 after
    })

    it("should handle edge cases with the current index at start or end", () => {
      // Arrange
      const cases = [
        // At the start
        { numberOfImages: 10, currentIndex: 0, expected: [0, 1, 2] },
        // At the end
        { numberOfImages: 10, currentIndex: 9, expected: [7, 8, 9] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex, expected }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 6, currentIndex: 2 },
        { numberOfImages: 10, currentIndex: 5 },
        { numberOfImages: 20, currentIndex: 15 },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
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
        { numberOfImages: 1, currentIndex: 0, expected: [0] },
        { numberOfImages: 3, currentIndex: 1, expected: [0, 1, 2] },
        { numberOfImages: 5, currentIndex: 2, expected: [0, 1, 2, 3, 4] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex, expected }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should center the current image with 2 images before it when possible", () => {
      // Act
      const result = getPreviewIndices({
        numberOfImages: 10,
        currentIndex: 5, // Current image is in the middle
        maxPreviewImages,
      })

      // Assert
      expect(result).toEqual([3, 4, 5, 6, 7]) // 2 before, current, 2 after
    })

    it("should adjust indices when close to the start", () => {
      // Act
      const result = getPreviewIndices({
        numberOfImages: 10,
        currentIndex: 1, // Current image is near the start
        maxPreviewImages,
      })

      // Assert
      expect(result).toEqual([0, 1, 2, 3, 4]) // Not enough room for 2 before
    })

    it("should adjust indices when close to the end", () => {
      // Act
      const result = getPreviewIndices({
        numberOfImages: 10,
        currentIndex: 8, // Current image is near the end
        maxPreviewImages,
      })

      // Assert
      expect(result).toEqual([5, 6, 7, 8, 9]) // Show last 5 images
    })

    it("should handle edge cases with the current index at start or end", () => {
      // Arrange
      const cases = [
        // At the start
        { numberOfImages: 10, currentIndex: 0, expected: [0, 1, 2, 3, 4] },
        // At the end
        { numberOfImages: 10, currentIndex: 9, expected: [5, 6, 7, 8, 9] },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex, expected }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
          maxPreviewImages,
        })
        expect(result).toEqual(expected)
      })
    })

    it("should always return exactly the maximum number of preview images when there are more images than the maximum", () => {
      // Arrange
      const cases = [
        { numberOfImages: 6, currentIndex: 2 },
        { numberOfImages: 10, currentIndex: 5 },
        { numberOfImages: 20, currentIndex: 15 },
      ]

      // Act & Assert
      cases.forEach(({ numberOfImages, currentIndex }) => {
        const result = getPreviewIndices({
          numberOfImages,
          currentIndex,
          maxPreviewImages,
        })
        expect(result.length).toBe(maxPreviewImages)
      })
    })
  })
})
