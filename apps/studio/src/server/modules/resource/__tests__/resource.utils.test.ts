import { describe, expect, it } from "vitest"

import { tokenizeSearchQuery } from "../resource.utils"

describe(tokenizeSearchQuery, () => {

  it("returns empty array for empty string", () => {
    expect(tokenizeSearchQuery("")).toStrictEqual([])
  })

  it("returns empty array for whitespace-only string", () => {
    expect(tokenizeSearchQuery("   ")).toStrictEqual([])
  })

  it("handles multiple consecutive spaces between terms", () => {
    expect(tokenizeSearchQuery("foo   bar")).toStrictEqual(["foo", "bar"])
  })

  it("lowercases all terms", () => {
    expect(tokenizeSearchQuery("Foo BAR")).toStrictEqual(["foo", "bar"])
  })

  it("deduplicates repeated terms", () => {
    expect(tokenizeSearchQuery("foo foo bar")).toStrictEqual(["foo", "bar"])
  })

  it("trims leading and trailing whitespace", () => {
    expect(tokenizeSearchQuery("  foo bar  ")).toStrictEqual(["foo", "bar"])
  })
})
