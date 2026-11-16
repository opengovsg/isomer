import { TRPCError } from "@trpc/server"
import superjson from "superjson"
import { describe, expect, it } from "vitest"

import { MAX_ANNOTATION_PATH_SEGMENTS, safeSuperjson } from "../safeTransformer"

// Crafted payloads aren't valid SuperJSONResults, which is the point.
const deserialize = (payload: unknown) =>
  safeSuperjson.deserialize(
    payload as Parameters<typeof safeSuperjson.deserialize>[0],
  )

const expectRejectedFast = (payload: unknown) => {
  const start = performance.now()
  expect(() => deserialize(payload)).toThrow(TRPCError)
  expect(performance.now() - start).toBeLessThan(100)
}

describe("safeSuperjson.deserialize", () => {
  it("rejects a Set and a nested Map", () => {
    // Arrange
    const set = superjson.serialize(new Set([1]))
    const nestedMap = superjson.serialize({ a: [{ m: new Map([["k", "v"]]) }] })

    // Act / Assert
    expect(() => deserialize(set)).toThrow(/Set and Map/)
    expect(() => deserialize(nestedMap)).toThrow(/Set and Map/)
  })

  it("rejects a set annotation hidden in array-shaped children", () => {
    // Arrange
    const payload = {
      json: { o: [0, 0, [1, 2]] },
      meta: { values: { o: ["number", [null, null, ["set"]]] } },
    }

    // Act / Assert
    expect(() => deserialize(payload)).toThrow(/Set and Map/)
  })

  it("rejects the O(n²) Set + referentialEqualities payload quickly", () => {
    // Arrange
    const n = 80_000
    const payload = {
      json: Array.from({ length: n }, () => []),
      meta: {
        values: ["set"],
        referentialEqualities: {
          "0": Array.from({ length: n }, (_, i) => `${n - 1 - i}`),
        },
      },
    }

    // Act / Assert
    expectRejectedFast(payload)
  })

  it("rejects one deep path with many children quickly", () => {
    // Arrange
    const deepPath = Array(20_000).fill("a").join(".")
    const children = Object.fromEntries(
      Array.from({ length: 20_000 }, (_, i) => [i, ["undefined"]]),
    )
    const payload = {
      json: {},
      meta: { values: { [deepPath]: ["undefined", children] } },
    }

    // Act / Assert
    expectRejectedFast(payload)
  })

  it("accepts annotation paths just under the budget", () => {
    // Arrange: 10 segments per path
    const values = Object.fromEntries(
      Array.from({ length: MAX_ANNOTATION_PATH_SEGMENTS / 10 - 1 }, (_, i) => [
        `a.b.c.d.e.f.g.h.i.${i}`,
        ["undefined"],
      ]),
    )

    // Act / Assert
    expect(() => deserialize({ json: {}, meta: { values } })).not.toThrow()
  })

  it("round-trips Dates, undefined and shared references", () => {
    // Arrange
    const shared = { at: new Date(0) }
    const value = { siteId: 1, a: shared, b: [shared], gone: undefined }

    // Act
    const result = deserialize(safeSuperjson.serialize(value)) as typeof value

    // Assert
    expect(result).toStrictEqual(value)
    expect(result.b[0]).toBe(result.a)
  })
})
