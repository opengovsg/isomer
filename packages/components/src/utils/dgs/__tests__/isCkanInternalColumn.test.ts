import { describe, expect, it } from "vitest"

import { isCkanInternalColumn } from "../isCkanInternalColumn"

describe(isCkanInternalColumn, () => {
  it("should return true for _id", () => {
    expect(isCkanInternalColumn("_id")).toBeTruthy()
  })

  it("should return true for _full_text", () => {
    expect(isCkanInternalColumn("_full_text")).toBeTruthy()
  })

  it("should return false for regular column names", () => {
    expect(isCkanInternalColumn("employment_rate")).toBeFalsy()
    expect(isCkanInternalColumn("year")).toBeFalsy()
    expect(isCkanInternalColumn("value")).toBeFalsy()
  })

  it("should return false for partial matches", () => {
    expect(isCkanInternalColumn("_id_extra")).toBeFalsy()
    expect(isCkanInternalColumn("my_id")).toBeFalsy()
    expect(isCkanInternalColumn("full_text")).toBeFalsy()
  })

  it("should be case-sensitive", () => {
    expect(isCkanInternalColumn("_ID")).toBeFalsy()
    expect(isCkanInternalColumn("_Full_Text")).toBeFalsy()
  })
})
