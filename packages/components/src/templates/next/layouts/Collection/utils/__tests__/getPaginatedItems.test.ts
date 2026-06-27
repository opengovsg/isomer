import type { ProcessedCollectionCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { getPaginatedItems } from "../getPaginatedItems"

const items = [
  { title: "Item 1" },
  { title: "Item 2" },
  { title: "Item 3" },
  { title: "Item 4" },
] as ProcessedCollectionCardProps[]

const itemsPerPage = 2

describe("getPaginatedItems", () => {
  it("returns the first page when currPage is NaN", () => {
    expect(getPaginatedItems(items, itemsPerPage, NaN)).toEqual([
      items[0],
      items[1],
    ])
  })

  it("returns the expected slice for a valid page number", () => {
    expect(getPaginatedItems(items, itemsPerPage, 2)).toEqual([
      items[2],
      items[3],
    ])
  })
})
