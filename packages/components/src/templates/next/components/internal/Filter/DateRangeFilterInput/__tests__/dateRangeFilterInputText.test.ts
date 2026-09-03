import { describe, expect, it } from "vitest"

import { parseInputText, valueToInputText } from "../dateRangeFilterInputText"

describe("valueToInputText", () => {
  it("returns an empty string when value is undefined", () => {
    expect(valueToInputText(undefined)).toBe("")
  })

  it("formats a single day without a range separator", () => {
    expect(valueToInputText({ start: "2026-06-10", end: "2026-06-10" })).toBe(
      "10/06/2026",
    )
  })

  it("formats a range with a separator", () => {
    expect(valueToInputText({ start: "2026-04-05", end: "2026-04-08" })).toBe(
      "05/04/2026 - 08/04/2026",
    )
  })
})

describe("parseInputText", () => {
  it("returns undefined for empty input", () => {
    expect(parseInputText("")).toBeUndefined()
    expect(parseInputText("   ")).toBeUndefined()
  })

  it("parses a valid single date", () => {
    expect(parseInputText("10/06/2026")).toEqual({
      start: "2026-06-10",
      end: "2026-06-10",
    })
  })

  it("parses a valid range in order", () => {
    expect(parseInputText("05/04/2026 - 08/04/2026")).toEqual({
      start: "2026-04-05",
      end: "2026-04-08",
    })
  })

  it("normalizes a reversed range", () => {
    expect(parseInputText("20/06/2026 - 10/06/2026")).toEqual({
      start: "2026-06-10",
      end: "2026-06-20",
    })
  })

  it("returns null for invalid calendar dates", () => {
    expect(parseInputText("31/02/2026")).toBeNull()
  })

  it("returns null for malformed input", () => {
    expect(parseInputText("10/06/2026 - 20/06/2026 - extra")).toBeNull()
    expect(parseInputText("not-a-date")).toBeNull()
  })
})
