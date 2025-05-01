import { describe, expect, it } from "vitest"

import { ALT_TEXT_REGEX_PATTERN } from "../../Image"

describe("AltTextSchema", () => {
  const altTextRegex = new RegExp(ALT_TEXT_REGEX_PATTERN)

  it("accepts valid alt text", () => {
    expect(altTextRegex.test("A fluffy cat sleeping")).toBe(true)
    expect(altTextRegex.test("Close-up of a sunflower")).toBe(true)
    expect(altTextRegex.test("19th-century building")).toBe(true)
  })

  it("accept words containing forbidden substrings but not the whole word", () => {
    expect(altTextRegex.test("forests concert image")).toBe(true)
    expect(altTextRegex.test("architectural diagram")).toBe(true)
    expect(altTextRegex.test("professional photo studio")).toBe(true)
  })

  it("rejects generic terms like 'image'", () => {
    expect(altTextRegex.test("image")).toBe(false)
    expect(altTextRegex.test("Image")).toBe(false)
    expect(altTextRegex.test("picture")).toBe(false)
    expect(altTextRegex.test("Picture")).toBe(false)
    expect(altTextRegex.test("logo")).toBe(false)
    expect(altTextRegex.test("Logo")).toBe(false)
    expect(altTextRegex.test("graph")).toBe(false)
    expect(altTextRegex.test("Graph")).toBe(false)
    expect(altTextRegex.test("screenshot")).toBe(false)
    expect(altTextRegex.test("Screenshot")).toBe(false)
    expect(altTextRegex.test("chart")).toBe(false)
    expect(altTextRegex.test("Chart")).toBe(false)
    expect(altTextRegex.test("diagram")).toBe(false)
    expect(altTextRegex.test("Diagram")).toBe(false)
    expect(altTextRegex.test("icon")).toBe(false)
    expect(altTextRegex.test("Icon")).toBe(false)
  })

  it("rejects empty or whitespace-only text", () => {
    expect(altTextRegex.test("")).toBe(false)
    expect(altTextRegex.test(" ")).toBe(false)
    expect(altTextRegex.test("     ")).toBe(false)
    expect(altTextRegex.test("\t\n")).toBe(false)
  })
})
