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

  it("clamps page 0 to page 1", () => {
    expect(getPaginatedItems(items, itemsPerPage, 0)).toEqual([
      items[0],
      items[1],
    ])
  })

  it("clamps a negative page to page 1", () => {
    expect(getPaginatedItems(items, itemsPerPage, -1)).toEqual([
      items[0],
      items[1],
    ])
  })

  it("returns an empty array when the page is beyond the last page", () => {
    expect(getPaginatedItems(items, itemsPerPage, 99)).toEqual([])
  })
})
