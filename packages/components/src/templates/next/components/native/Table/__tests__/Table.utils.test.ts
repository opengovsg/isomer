import { describe, expect, it } from "vitest"

import { getPublishedTableCaption } from "../Table.utils"

describe("getPublishedTableCaption", () => {
  it("returns null for empty and default placeholder captions", () => {
    expect(getPublishedTableCaption("")).toBeNull()
    expect(getPublishedTableCaption("   ")).toBeNull()
    expect(getPublishedTableCaption("Table caption")).toBeNull()
    expect(getPublishedTableCaption("Table caption is required")).toBeNull()
  })

  it("returns the caption when it is real content", () => {
    expect(getPublishedTableCaption("Quarterly revenue by department")).toBe(
      "Quarterly revenue by department",
    )
  })
})
