import { describe, expect, it } from "vitest"

import type { ProcessedCollectionCardProps } from "~/interfaces"
import { NO_SPECIFIED_YEAR_FILTER_ID } from "../constants"
import { getYearFilter } from "../getYearFilter"

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
      {
        lastUpdated: "2023-01-01",
      } as ProcessedCollectionCardProps,
      {
        lastUpdated: "2023-06-15",
      } as ProcessedCollectionCardProps,
      {
        lastUpdated: "2022-12-31",
      } as ProcessedCollectionCardProps,
      {
        lastUpdated: "2022-01-01",
      } as ProcessedCollectionCardProps,
      {
        lastUpdated: undefined,
      } as ProcessedCollectionCardProps,
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
      { lastUpdated: "2023-01-01" } as ProcessedCollectionCardProps,
      { lastUpdated: "2023-01-01" } as ProcessedCollectionCardProps,
      { lastUpdated: "2023-01-01" } as ProcessedCollectionCardProps,
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
      { lastUpdated: undefined } as ProcessedCollectionCardProps,
      { lastUpdated: undefined } as ProcessedCollectionCardProps,
      { lastUpdated: undefined } as ProcessedCollectionCardProps,
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
