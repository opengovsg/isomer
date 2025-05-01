import Ajv from "ajv"
import { describe, expect, it } from "vitest"

import { AltTextSchema } from "../../Image"

const ajv = new Ajv()
const validate = ajv.compile(AltTextSchema)

describe("AltTextSchema", () => {
  it("accepts valid alt text", () => {
    expect(validate("A fluffy cat sleeping")).toBe(true)
    expect(validate("Close-up of a sunflower")).toBe(true)
    expect(validate("19th-century building")).toBe(true)
  })

  it("accept words containing forbidden substrings but not the whole word", () => {
    expect(validate("forests concert image")).toBe(true)
    expect(validate("architectural diagram")).toBe(true)
    expect(validate("professional photo studio")).toBe(true)
  })

  it("rejects generic terms like 'image'", () => {
    expect(validate("image")).toBe(false)
    expect(validate("Image")).toBe(false)
    expect(validate("picture")).toBe(false)
    expect(validate("Picture")).toBe(false)
    expect(validate("photo")).toBe(false)
    expect(validate("Photo")).toBe(false)
    expect(validate("logo")).toBe(false)
    expect(validate("Logo")).toBe(false)
    expect(validate("graph")).toBe(false)
    expect(validate("Graph")).toBe(false)
    expect(validate("screenshot")).toBe(false)
    expect(validate("Screenshot")).toBe(false)
    expect(validate("chart")).toBe(false)
    expect(validate("Chart")).toBe(false)
    expect(validate("diagram")).toBe(false)
    expect(validate("Diagram")).toBe(false)
    expect(validate("icon")).toBe(false)
    expect(validate("Icon")).toBe(false)
  })

  it("rejects empty or whitespace-only text", () => {
    expect(validate("")).toBe(false)
    expect(validate(" ")).toBe(false)
    expect(validate("     ")).toBe(false)
    expect(validate("\t\n")).toBe(false)
  })

  it("rejects overly long alt text", () => {
    expect(validate("A".repeat(121))).toBe(false)
  })
})
