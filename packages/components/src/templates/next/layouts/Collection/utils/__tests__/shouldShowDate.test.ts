import type { ProcessedCollectionCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { shouldShowDate } from "../shouldShowDate"
import { testCollectionItem } from "./testHelpers"

describe("shouldShowDate", () => {
  it("returns true if any item has date", () => {
    const items = [
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "Description 1",
        title: "Item 1",
      }),
      testCollectionItem({
        date: undefined,
        description: "Description 2",
        title: "Item 2",
      }),
    ]

    expect(shouldShowDate(items)).toBe(true)
  })

  it("returns false if no items have date", () => {
    const items = [
      testCollectionItem({
        date: undefined,
        description: "Description 1",
        title: "Item 1",
      }),
      testCollectionItem({
        date: undefined,
        description: "Description 2",
        title: "Item 2",
      }),
    ]

    expect(shouldShowDate(items)).toBe(false)
  })

  it("returns false for empty array", () => {
    expect(shouldShowDate([])).toBe(false)
  })
})
