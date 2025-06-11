import { cloneDeep } from "lodash"
import { describe, expect, it } from "vitest"

import { ChildPage } from "../types"
import { mergeChildrenPages } from "../utils"

const MOCK_CHILDREN_PAGES: ChildPage[] = [
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
]

describe("ChildrenPages.utils", () => {
  it("should sort the children pages in the order specified", () => {
    // Arrange
    const ordering = ["3", "1", "4", "2", "5", "6"]

    // Act
    // NOTE: need to deep clone because `sort` is inplace
    const actual = cloneDeep(MOCK_CHILDREN_PAGES).sort((a, b) =>
      mergeChildrenPages(a, b, ordering),
    )

    // Assert
    expect(actual.map(({ id }) => id)).toEqual(ordering)
  })

  it("should add children pages that are not in ordering at the back of the array", () => {
    // Arrange
    const ordering = ["3", "1", "4", "2", "5", "6"]
    const arr = [
      {
        id: "22",
        title: "random title 22",
        url: "random url 22",
        description: "random desc 22",
      },
      ...cloneDeep(MOCK_CHILDREN_PAGES),
    ]

    // Act
    // NOTE: need to deep clone because `sort` is inplace
    const actual = arr.sort((a, b) => mergeChildrenPages(a, b, ordering))

    // Assert
    expect(actual.map(({ id }) => id)).toEqual([...ordering, "22"])
  })
  it("should respect numeric sorting for title when the pages are not specified in the order", () => {
    // Arrange
    const ordering: never[] = []
    const arr = [
      {
        id: "1",
        title: "random title 1",
        url: "random url 1",
        description: "random desc 1",
      },
      {
        id: "10",
        title: "random title 10",
        url: "random url 10",
        description: "random desc 10",
      },
    ]

    // Act
    // NOTE: need to deep clone because `sort` is inplace
    const actual = arr.sort((a, b) => mergeChildrenPages(a, b, ordering))

    // Assert
    expect(actual.map(({ id }) => id)).toEqual(["1", "10"])
  })
  it("should be case sensitive for title sorting when the pages are not specified in the order", () => {
    // Arrange
    const ordering: never[] = []
    const arr = [
      {
        id: "1",
        title: "random title 1",
        url: "random url 1",
        description: "random desc 1",
      },
      {
        id: "2",
        title: "Random title 1",
        url: "random url 1",
        description: "random desc 1",
      },
    ]

    // Act
    // NOTE: need to deep clone because `sort` is inplace
    const actual = arr.sort((a, b) => mergeChildrenPages(a, b, ordering))

    // Assert
    expect(actual.map(({ id }) => id)).toEqual(["1", "2"])
  })
})
