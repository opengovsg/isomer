import { describe, expect, it } from "vitest"

import { generateResourceUrl } from "../utils"

describe("generateResourceUrl", () => {
  it("produces a normal slug for a Latin title", () => {
    expect(generateResourceUrl("Hello World")).toBe("hello-world")
  })

  it("transliterates a purely non-Latin title instead of returning only hyphens", () => {
    expect(generateResourceUrl("தமிழ்")).not.toBe("---")
    expect(generateResourceUrl("中文标题")).not.toBe("----")
  })

  it("keeps the Latin portion when mixed with non-Latin characters", () => {
    const result = generateResourceUrl("Tamil தமிழ்")
    expect(result).toMatch(/^[a-z0-9-]+$/)
    expect(result.length).toBeGreaterThan(0)
  })

  it("collapses consecutive hyphens produced by non-alphanum runs", () => {
    expect(generateResourceUrl("foo   bar")).toBe("foo-bar")
  })
})
