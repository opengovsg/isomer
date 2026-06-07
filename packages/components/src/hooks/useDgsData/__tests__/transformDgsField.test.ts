import { describe, expect, it } from "vitest"

import { transformDgsField } from "../transformDgsField"

describe("transformDgsField", () => {
  it("should return non-DGS fields unchanged", () => {
    expect(transformDgsField("Hello", {})).toBe("Hello")
  })

  it("should resolve DGS string column values", () => {
    expect(transformDgsField("[dgs:name]", { name: "Sentosa" })).toBe("Sentosa")
  })

  it("should coerce DGS numeric column values to strings", () => {
    expect(transformDgsField("[dgs:year]", { year: 2023 })).toBe("2023")
  })

  it("should return undefined for missing DGS columns", () => {
    expect(transformDgsField("[dgs:missing]", {})).toBeUndefined()
  })

  it("should return undefined when field is undefined", () => {
    expect(transformDgsField(undefined, { name: "Sentosa" })).toBeUndefined()
  })

  it("should return null when field is null", () => {
    expect(transformDgsField(null, { name: "Sentosa" })).toBeNull()
  })
})
