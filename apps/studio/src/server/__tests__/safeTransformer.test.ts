import { describe, expect, it } from "vitest"
import superjson from "superjson"

import { safeSuperjson } from "../safeTransformer"

describe("safeSuperjson.deserialize", () => {
  it("rejects a payload containing a Set (DoS vector)", () => {
    const payload = superjson.serialize(new Set([1, 2, 3]))
    expect(() => safeSuperjson.deserialize(payload)).toThrow(/Set and Map/)
  })

  it("rejects a Map nested inside an object", () => {
    const payload = superjson.serialize({ a: { m: new Map([["k", "v"]]) } })
    expect(() => safeSuperjson.deserialize(payload)).toThrow(/Set and Map/)
  })

  it("rejects the shared-reference-into-Set O(n²) attack shape", () => {
    const objs = [{ i: 0 }, { i: 1 }]
    const payload = superjson.serialize({ s: new Set(objs), dup: objs })
    expect(() => safeSuperjson.deserialize(payload)).toThrow(/Set and Map/)
  })

  it("round-trips normal input including Dates", () => {
    const value = { siteId: 1, when: new Date(0), tags: ["a", "b"] }
    const payload = safeSuperjson.serialize(value)
    expect(safeSuperjson.deserialize(payload)).toEqual(value)
  })
})
