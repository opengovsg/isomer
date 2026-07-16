import type { ProcessedCollectionCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { shouldShowDate } from "../shouldShowDate"

describe("shouldShowDate", () => {
  it("returns true if any item has date", () => {
    const items = [
      {
        title: "Item 1",
        description: "Description 1",
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        description: "Description 2",
        date: undefined,
      } as ProcessedCollectionCardProps,
    ]

    expect(shouldShowDate(items)).toBe(true)
  })

  it("returns false if no items have date", () => {
    const items = [
      {
        title: "Item 1",
        description: "Description 1",
        date: undefined,
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        description: "Description 2",
        date: undefined,
      } as ProcessedCollectionCardProps,
    ]

    expect(shouldShowDate(items)).toBe(false)
  })

  it("returns false for empty array", () => {
    expect(shouldShowDate([])).toBe(false)
  })
})
