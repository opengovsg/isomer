import { describe, expect, it } from "vitest"

import { mergeChildrenPages } from "../sitemap"

describe("sitemap utils", () => {
  describe("mergeChildrenPages", () => {
    it("should sort pages according to the specified ordering", () => {
      // Arrange
      const ordering = ["3", "1", "4", "2"]
      const pages = [
        { id: "1", title: "Page 1" },
        { id: "2", title: "Page 2" },
        { id: "3", title: "Page 3" },
        { id: "4", title: "Page 4" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["3", "1", "4", "2"])
    })

    it("should place pages not in ordering at the end, sorted alphabetically by title", () => {
      // Arrange
      const ordering = ["1", "2"]
      const pages = [
        { id: "1", title: "First Page" },
        { id: "2", title: "Second Page" },
        { id: "3", title: "Zebra Page" },
        { id: "4", title: "Apple Page" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["1", "2", "4", "3"])
    })

    it("should sort alphabetically by title when ordering is empty", () => {
      // Arrange
      const ordering: string[] = []
      const pages = [
        { id: "1", title: "Zebra" },
        { id: "2", title: "Apple" },
        { id: "3", title: "Mango" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["2", "3", "1"])
    })

    it("should sort alphabetically by title when ordering is not provided", () => {
      // Arrange
      const pages = [
        { id: "1", title: "Zebra" },
        { id: "2", title: "Apple" },
        { id: "3", title: "Mango" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) => mergeChildrenPages(a, b))

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["2", "3", "1"])
    })

    it("should handle numeric sorting in titles correctly", () => {
      // Arrange
      const ordering: string[] = []
      const pages = [
        { id: "a", title: "Page 10" },
        { id: "b", title: "Page 2" },
        { id: "c", title: "Page 1" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["c", "b", "a"])
    })

    it("should handle mixed ordered and unordered pages", () => {
      // Arrange
      const ordering = ["2", "4"]
      const pages = [
        { id: "1", title: "Alpha" },
        { id: "2", title: "Beta" },
        { id: "3", title: "Gamma" },
        { id: "4", title: "Delta" },
        { id: "5", title: "Epsilon" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["2", "4", "1", "5", "3"])
    })

    it("should handle ordering with IDs not present in pages", () => {
      // Arrange
      const ordering = ["999", "1", "888", "2"]
      const pages = [
        { id: "1", title: "Page 1" },
        { id: "2", title: "Page 2" },
        { id: "3", title: "Page 3" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["1", "2", "3"])
    })

    it("should be stable for pages with same ordering position", () => {
      // Arrange
      const ordering = ["1"]
      const pages = [
        { id: "2", title: "Same Title" },
        { id: "3", title: "Same Title" },
        { id: "1", title: "First" },
      ]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted[0]?.id).toEqual("1")
      expect(sorted.slice(1).map(({ id }) => id)).toContain("2")
      expect(sorted.slice(1).map(({ id }) => id)).toContain("3")
    })

    it("should handle single page array", () => {
      // Arrange
      const ordering = ["1"]
      const pages = [{ id: "1", title: "Only Page" }]

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["1"])
    })

    it("should handle empty pages array", () => {
      // Arrange
      const ordering = ["1", "2", "3"]
      const pages: { id: string; title: string }[] = []

      // Act
      const sorted = [...pages].sort((a, b) =>
        mergeChildrenPages(a, b, ordering),
      )

      // Assert
      expect(sorted).toEqual([])
    })
  })
})
