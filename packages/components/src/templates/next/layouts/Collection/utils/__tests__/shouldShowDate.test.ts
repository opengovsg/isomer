import { describe, expect, it } from "vitest"

import type { ProcessedCollectionCardProps } from "~/interfaces"
import { shouldShowDate } from "../shouldShowDate"

describe("shouldShowDate", () => {
  it("returns true if any item has lastUpdated", () => {
    const items = [
      {
        title: "Item 1",
        description: "Description 1",
        lastUpdated: "2023-01-01",
        category: "category1",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        description: "Description 2",
        lastUpdated: undefined,
        category: "category2",
      } as ProcessedCollectionCardProps,
    ]

    expect(shouldShowDate(items)).toBe(true)
  })

  it("returns false if no items have lastUpdated", () => {
    const items = [
      {
        title: "Item 1",
        description: "Description 1",
        lastUpdated: undefined,
        category: "category1",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        description: "Description 2",
        lastUpdated: undefined,
        category: "category2",
      } as ProcessedCollectionCardProps,
    ]

    expect(shouldShowDate(items)).toBe(false)
  })

  it("returns false for empty array", () => {
    expect(shouldShowDate([])).toBe(false)
  })
})
