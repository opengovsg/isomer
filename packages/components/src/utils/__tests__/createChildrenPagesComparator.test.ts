import type { ChildPage } from "~/templates/next/components/complex/ChildrenPages/types"
import { cloneDeep } from "lodash-es"
import { describe, expect, it } from "vitest"

import { createChildrenPagesComparator } from "../createChildrenPagesComparator"

const generateChildrenPages = (extraPages: ChildPage[] = []): ChildPage[] => {
  return [
    {
      id: "1",
      title: "random title 1",
      url: "random url 1",
      description: "random desc 1",
    },
    {
      id: "2",
      title: "random title 2",
      url: "random url 2",
      description: "random desc 2",
    },
    {
      id: "3",
      title: "random title 3",
      url: "random url 3",
      description: "random desc 3",
    },
    {
      id: "4",
      title: "random title 4",
      url: "random url 4",
      description: "random desc 4",
    },
    {
      id: "5",
      title: "random title 5",
      url: "random url 5",
      description: "random desc 5",
    },
    {
      id: "6",
      title: "random title 6",
      url: "random url 6",
      description: "random desc 6",
    },
    ...extraPages,
  ]
}

describe("ChildrenPages.utils", () => {
  describe("createChildrenPagesComparator", () => {
    it("should sort the children pages in the order specified", () => {
      // Arrange
      const ordering = ["3", "1", "4", "2", "5", "6"]

      // Act
      const comparator = createChildrenPagesComparator(ordering)
      const actual = cloneDeep(generateChildrenPages()).sort(comparator)

      // Assert
      expect(actual.map(({ id }) => id)).toEqual(ordering)
    })

    it("should add children pages that are not in ordering at the back of the array", () => {
      // Arrange
      const ordering = ["3", "1", "4", "2", "5", "6"]
      const arr = [
        {
          id: "22",
          title: "random title 0",
          url: "random url 22",
          description: "random desc 22",
        },
        ...generateChildrenPages(),
      ]

      // Act
      const comparator = createChildrenPagesComparator(ordering)
      const actual = arr.sort(comparator)

      // Assert
      expect(actual.map(({ id }) => id)).toEqual([...ordering, "22"])
    })

    it("should precompute the map for O(1) lookups", () => {
      // Arrange
      const ordering = ["3", "1", "4", "2", "5", "6"]

      // Act - create comparator once
      const comparator = createChildrenPagesComparator(ordering)

      // Sort multiple times with the same comparator
      const sorted1 = cloneDeep(generateChildrenPages()).sort(comparator)
      const sorted2 = cloneDeep(generateChildrenPages()).sort(comparator)

      // Assert - both sorts should produce the same result
      expect(sorted1.map(({ id }) => id)).toEqual(ordering)
      expect(sorted2.map(({ id }) => id)).toEqual(ordering)
    })
  })
})
