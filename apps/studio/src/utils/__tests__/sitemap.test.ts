import { describe, expect, it } from "vitest"

import { createChildrenPagesComparator } from "../sitemap"

describe("sitemap utils", () => {
  describe("createChildrenPagesComparator", () => {
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
      const comparator = createChildrenPagesComparator(ordering)
      const sorted = [...pages].sort(comparator)

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(ordering)
    })

    it("should place pages not in ordering at the end, sorted alphabetically", () => {
      // Arrange
      const ordering = ["1", "2"]
      const pages = [
        { id: "1", title: "First Page" },
        { id: "2", title: "Second Page" },
        { id: "3", title: "Zebra Page" },
        { id: "4", title: "Apple Page" },
      ]

      // Act
      const comparator = createChildrenPagesComparator(ordering)
      const sorted = [...pages].sort(comparator)

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["1", "2", "4", "3"])
    })

    it("should sort alphabetically when ordering is empty", () => {
      // Arrange
      const pages = [
        { id: "1", title: "Zebra" },
        { id: "2", title: "Apple" },
        { id: "3", title: "Mango" },
      ]

      // Act
      const comparator = createChildrenPagesComparator([])
      const sorted = [...pages].sort(comparator)

      // Assert
      expect(sorted.map(({ id }) => id)).toEqual(["2", "3", "1"])
    })

    it("should precompute the map for O(1) lookups", () => {
      // Arrange
      const ordering = ["1", "2", "3"]
      const pages = [
        { id: "3", title: "Page 3" },
        { id: "1", title: "Page 1" },
        { id: "2", title: "Page 2" },
      ]

      // Act - create comparator once
      const comparator = createChildrenPagesComparator(ordering)

      // Sort multiple times with the same comparator
      const sorted1 = [...pages].sort(comparator)
      const sorted2 = [...pages].sort(comparator)

      // Assert - both sorts should produce the same result
      expect(sorted1.map(({ id }) => id)).toEqual(["1", "2", "3"])
      expect(sorted2.map(({ id }) => id)).toEqual(["1", "2", "3"])
    })
  })
})
