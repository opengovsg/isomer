import { describe, expect, it } from "vitest"

import { normalizeRotation } from "./TransformControl"

describe("normalizeRotation", () => {
  it("rotates right in 90° steps, wrapping past 270 back to 0", () => {
    expect(normalizeRotation(0 + 90)).toBe(90)
    expect(normalizeRotation(90 + 90)).toBe(180)
    expect(normalizeRotation(270 + 90)).toBe(0)
  })

  it("rotates left into the 0|90|180|270 domain (negative input)", () => {
    expect(normalizeRotation(0 - 90)).toBe(270)
    expect(normalizeRotation(90 - 90)).toBe(0)
    expect(normalizeRotation(180 - 90)).toBe(90)
  })
})
