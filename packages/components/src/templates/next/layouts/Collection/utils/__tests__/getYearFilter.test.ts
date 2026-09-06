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
      items: [],
      label: "Year",
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
      items: [
        { count: 2, id: "2023", label: "2023" },
        { count: 2, id: "2022", label: "2022" },
        { count: 1, id: NO_SPECIFIED_YEAR_FILTER_ID, label: "Not specified" },
      ],
      label: "Year",
    })
  })

  it("should return a single item if all items have the same year", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "",
        title: "Item 1",
      }),
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "",
        title: "Item 2",
      }),
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "",
        title: "Item 3",
      }),
    ]

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      items: [{ count: 3, id: "2023", label: "2023" }],
      label: "Year",
    })
  })

  it("should not return any items if all items have no dates", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({ date: undefined, description: "", title: "Item 1" }),
      testCollectionItem({ date: undefined, description: "", title: "Item 2" }),
      testCollectionItem({ date: undefined, description: "", title: "Item 3" }),
    ]

    // Act
    const result = getYearFilter(items)

    // Assert
    expect(result).toEqual({
      id: "year",
      items: [],
      label: "Year",
    })
  })
})
