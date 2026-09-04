import { describe, expect, it } from "vitest"

import { isCkanInternalColumn } from "../isCkanInternalColumn"

describe("isCkanInternalColumn", () => {
  it("should return true for _id", () => {
    expect(isCkanInternalColumn("_id")).toBe(true)
  })

  it("should return true for _full_text", () => {
    expect(isCkanInternalColumn("_full_text")).toBe(true)
  })

  it("should return false for regular column names", () => {
    expect(isCkanInternalColumn("employment_rate")).toBe(false)
    expect(isCkanInternalColumn("year")).toBe(false)
    expect(isCkanInternalColumn("value")).toBe(false)
  })

  it("should return false for partial matches", () => {
    expect(isCkanInternalColumn("_id_extra")).toBe(false)
    expect(isCkanInternalColumn("my_id")).toBe(false)
    expect(isCkanInternalColumn("full_text")).toBe(false)
  })

  it("should be case-sensitive", () => {
    expect(isCkanInternalColumn("_ID")).toBe(false)
    expect(isCkanInternalColumn("_Full_Text")).toBe(false)
  })
})
