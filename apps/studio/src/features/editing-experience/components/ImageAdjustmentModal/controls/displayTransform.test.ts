import { describe, expect, it } from "vitest"

import type { CropRectNormalized } from "./cropGeometry"
import {
  flipPointH,
  flipPointV,
  flipRectH,
  flipRectV,
  normalizeRotation,
  rotatePointCcw,
  rotatePointCw,
  rotateRectCcw,
  rotateRectCw,
} from "./displayTransform"

const expectRectClose = (
  actual: CropRectNormalized,
  expected: CropRectNormalized,
) => {
  expect(actual.x).toBeCloseTo(expected.x, 10)
  expect(actual.y).toBeCloseTo(expected.y, 10)
  expect(actual.width).toBeCloseTo(expected.width, 10)
  expect(actual.height).toBeCloseTo(expected.height, 10)
}

describe("normalizeRotation", () => {
  it("rotates right in 90° steps, wrapping past 270 back to 0", () => {
    expect(normalizeRotation(0 + 90)).toBe(90)
    expect(normalizeRotation(270 + 90)).toBe(0)
  })

  it("rotates left into the 0|90|180|270 domain (negative input)", () => {
    expect(normalizeRotation(0 - 90)).toBe(270)
    expect(normalizeRotation(180 - 90)).toBe(90)
  })
})

describe("rect transforms", () => {
  const rect: CropRectNormalized = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }

  it("rotates a rect clockwise (swapping width/height)", () => {
    expectRectClose(rotateRectCw(rect), {
      x: 1 - 0.2 - 0.4,
      y: 0.1,
      width: 0.4,
      height: 0.3,
    })
  })

  it("rotateRectCcw is the inverse of rotateRectCw", () => {
    expectRectClose(rotateRectCcw(rotateRectCw(rect)), rect)
  })

  it("leaves the full-image rect unchanged under rotation and flips", () => {
    const full: CropRectNormalized = { x: 0, y: 0, width: 1, height: 1 }
    expectRectClose(rotateRectCw(full), full)
    expectRectClose(flipRectH(full), full)
    expectRectClose(flipRectV(full), full)
  })

  it("flips a rect horizontally/vertically and back", () => {
    expectRectClose(flipRectH(rect), {
      x: 1 - 0.1 - 0.3,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    })
    expectRectClose(flipRectH(flipRectH(rect)), rect)
    expectRectClose(flipRectV(flipRectV(rect)), rect)
  })

  it("preserves a locked ratio's shape under flips but inverts it under a quarter turn", () => {
    // A 5:6-ish rect on a square image: pixel ratio tracks width:height here.
    const locked: CropRectNormalized = { x: 0.1, y: 0, width: 0.5, height: 0.6 }
    // Flip keeps width/height (ratio preserved).
    expect(flipRectH(locked).width).toBeCloseTo(0.5)
    expect(flipRectH(locked).height).toBeCloseTo(0.6)
    // Quarter turn swaps them (ratio inverts) — why the modal re-fits locked
    // crops rather than rotating them geometrically.
    expect(rotateRectCw(locked).width).toBeCloseTo(0.6)
    expect(rotateRectCw(locked).height).toBeCloseTo(0.5)
  })
})

describe("point transforms (crop-relative focal)", () => {
  const p = { x: 0.25, y: 0.1 }

  it("rotates a point clockwise and back", () => {
    expect(rotatePointCw(p)).toEqual({ x: 1 - 0.1, y: 0.25 })
    const roundTrip = rotatePointCcw(rotatePointCw(p))
    expect(roundTrip.x).toBeCloseTo(0.25)
    expect(roundTrip.y).toBeCloseTo(0.1)
  })

  it("flips a point horizontally/vertically", () => {
    expect(flipPointH(p)).toEqual({ x: 0.75, y: 0.1 })
    expect(flipPointV(p)).toEqual({ x: 0.25, y: 0.9 })
  })

  it("leaves the centre point fixed under every transform", () => {
    const c = { x: 0.5, y: 0.5 }
    expect(rotatePointCw(c)).toEqual(c)
    expect(flipPointH(c)).toEqual(c)
    expect(flipPointV(c)).toEqual(c)
  })
})
