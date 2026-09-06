import type { ProcessedCollectionCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { NO_SPECIFIED_YEAR_FILTER_ID } from "../constants"
import { getYearFilter } from "../getYearFilter"
import { testCollectionItem } from "./testHelpers"

describe("getYearFilter", () => {
  it("should return empty filter items when no items provided", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = []

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      label: "Year",
      items: [],
    })
  })

  it("should count and format years correctly", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        date: new Date("2023-01-01"),
      }),
      testCollectionItem({
        date: new Date("2023-06-15"),
      }),
      testCollectionItem({
        date: new Date("2022-12-31"),
      }),
      testCollectionItem({
        date: new Date("2022-01-01"),
      }),
      testCollectionItem({
        date: undefined,
      }),
    ]

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      label: "Year",
      items: [
        { id: "2023", label: "2023", count: 2 },
        { id: "2022", label: "2022", count: 2 },
        { id: NO_SPECIFIED_YEAR_FILTER_ID, label: "Not specified", count: 1 },
      ],
    })
  })

  it("should return a single item if all items have the same year", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "Item 1",
        description: "",
        date: new Date("2023-01-01"),
      }),
      testCollectionItem({
        title: "Item 2",
        description: "",
        date: new Date("2023-01-01"),
      }),
      testCollectionItem({
        title: "Item 3",
        description: "",
        date: new Date("2023-01-01"),
      }),
    ]

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      label: "Year",
      items: [{ id: "2023", label: "2023", count: 3 }],
    })
  })

  it("should not return any items if all items have no dates", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({ title: "Item 1", description: "", date: undefined }),
      testCollectionItem({ title: "Item 2", description: "", date: undefined }),
      testCollectionItem({ title: "Item 3", description: "", date: undefined }),
    ]

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      label: "Year",
      items: [],
    })
  })
})
