import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

import { TableBaseCellSchema } from "../Table"

describe("TableBaseCellSchema", () => {
  it("accepts backgroundColor null from TipTap defaults", () => {
    expect(Value.Check(TableBaseCellSchema, { backgroundColor: null })).toBe(
      true,
    )
  })

  it("accepts a colour token", () => {
    expect(Value.Check(TableBaseCellSchema, { backgroundColor: "blue" })).toBe(
      true,
    )
  })

  it("rejects an unknown colour token", () => {
    expect(Value.Check(TableBaseCellSchema, { backgroundColor: "pink" })).toBe(
      false,
    )
  })
})
