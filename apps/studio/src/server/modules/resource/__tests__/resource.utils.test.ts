import { describe, expect, it } from "vitest"

import { tokenizeSearchQuery } from "../resource.utils"

describe("tokenizeSearchQuery", () => {
  it("returns empty array for empty string", () => {
    expect(tokenizeSearchQuery("")).toEqual([])
  })

  it("returns empty array for whitespace-only string", () => {
    expect(tokenizeSearchQuery("   ")).toEqual([])
  })

  it("handles multiple consecutive spaces between terms", () => {
    expect(tokenizeSearchQuery("foo   bar")).toEqual(["foo", "bar"])
  })

  it("lowercases all terms", () => {
    expect(tokenizeSearchQuery("Foo BAR")).toEqual(["foo", "bar"])
  })

  it("deduplicates repeated terms", () => {
    expect(tokenizeSearchQuery("foo foo bar")).toEqual(["foo", "bar"])
  })

  it("trims leading and trailing whitespace", () => {
    expect(tokenizeSearchQuery("  foo bar  ")).toEqual(["foo", "bar"])
  })
})
