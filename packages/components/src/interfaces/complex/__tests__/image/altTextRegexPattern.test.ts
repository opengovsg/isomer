import { describe, expect, it } from "vitest"

import { ALT_TEXT_REGEX_PATTERN } from "../../Image"

describe("AltTextSchema", () => {
  const altTextRegex = new RegExp(ALT_TEXT_REGEX_PATTERN)

  it("accepts valid alt text", () => {
    expect(altTextRegex.test("A fluffy cat sleeping")).toBeTruthy()
    expect(altTextRegex.test("Close-up of a sunflower")).toBeTruthy()
    expect(altTextRegex.test("19th-century building")).toBeTruthy()
  })

  it("accept words containing forbidden substrings but not the whole word", () => {
    expect(altTextRegex.test("forests concert image")).toBeTruthy()
    expect(altTextRegex.test("architectural diagram")).toBeTruthy()
    expect(altTextRegex.test("professional photo studio")).toBeTruthy()
  })

  it.each([
  ["image"],
  ["Image"],
  ["picture"],
  ["Picture"],
  ["logo"],
  ["Logo"],
  ["graph"],
  ["Graph"],
  ["screenshot"],
  ["Screenshot"],
  ["chart"],
  ["Chart"],
  ["diagram"],
  ["Diagram"],
  ["icon"],
  ["Icon"],
])("rejects generic term %s", (term) => {
    expect(altTextRegex.test(term)).toBeFalsy()
  })

  it("rejects empty or whitespace-only text", () => {
    expect(altTextRegex.test("")).toBeFalsy()
    expect(altTextRegex.test(" ")).toBeFalsy()
    expect(altTextRegex.test("     ")).toBeFalsy()
    expect(altTextRegex.test("\t\n")).toBeFalsy()
  })
})
