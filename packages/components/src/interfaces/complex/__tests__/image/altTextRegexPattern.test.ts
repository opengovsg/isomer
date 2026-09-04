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
    const genericTerms = [
      "image",
      "Image",
      "picture",
      "Picture",
      "logo",
      "Logo",
      "graph",
      "Graph",
      "screenshot",
      "Screenshot",
      "chart",
      "Chart",
      "diagram",
      "Diagram",
      "icon",
      "Icon",
    ]
    expect(genericTerms.map((term) => altTextRegex.test(term))).toStrictEqual(
      genericTerms.map(() => false),
    )
  })

  it("rejects empty or whitespace-only text", () => {
    expect(altTextRegex.test("")).toBe(false)
    expect(altTextRegex.test(" ")).toBe(false)
    expect(altTextRegex.test("     ")).toBe(false)
    expect(altTextRegex.test("\t\n")).toBe(false)
  })
})
