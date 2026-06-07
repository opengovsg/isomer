import { describe, expect, it } from "vitest"

import { safeJsonParse } from "../safeJsonParse"

describe("safeJsonParse", () => {
  it("should parse JSON objects", () => {
    expect(safeJsonParse('{"label":"Test"}')).toEqual({ label: "Test" })
  })

  it("should parse JSON arrays", () => {
    expect(safeJsonParse('[{"method":"email"}]')).toEqual([{ method: "email" }])
  })

  it("should return undefined for JSON primitives", () => {
    expect(safeJsonParse("123")).toBeUndefined()
    expect(safeJsonParse('"hello"')).toBeUndefined()
  })

  it("should return undefined for raw numbers", () => {
    expect(safeJsonParse(123)).toBeUndefined()
  })
})
