import { describe, it, expect } from "vitest"

import { clampUnit, pointToFocal } from "./focalGeometry"

describe("clampUnit", () => {
  it("clamps values below 0 to 0", () => {
    expect(clampUnit(-0.5)).toBe(0)
    expect(clampUnit(-100)).toBe(0)
  })

  it("clamps values above 1 to 1", () => {
    expect(clampUnit(1.5)).toBe(1)
    expect(clampUnit(100)).toBe(1)
  })

  it("passes through values in [0, 1]", () => {
    expect(clampUnit(0)).toBe(0)
    expect(clampUnit(0.5)).toBe(0.5)
    expect(clampUnit(1)).toBe(1)
  })
})

describe("pointToFocal", () => {
  it("maps center of rect to {0.5, 0.5}", () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const focal = pointToFocal(200, 200, rect)
    expect(focal).toEqual({ x: 0.5, y: 0.5 })
  })

  it("maps top-left corner to {0, 0}", () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const focal = pointToFocal(100, 100, rect)
    expect(focal).toEqual({ x: 0, y: 0 })
  })

  it("maps bottom-right corner to {1, 1}", () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const focal = pointToFocal(300, 300, rect)
    expect(focal).toEqual({ x: 1, y: 1 })
  })

  it("clamps coordinates beyond edges to [0, 1]", () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const focal = pointToFocal(400, 400, rect)
    expect(focal).toEqual({ x: 1, y: 1 })
  })

  it("clamps negative coordinates to [0, 1]", () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const focal = pointToFocal(-50, -50, rect)
    expect(focal).toEqual({ x: 0, y: 0 })
  })

  it("returns {0.5, 0.5} when width is 0", () => {
    const rect = { left: 100, top: 100, width: 0, height: 200 }
    const focal = pointToFocal(100, 200, rect)
    expect(focal).toEqual({ x: 0.5, y: 0.5 })
  })

  it("returns {0.5, 0.5} when height is 0", () => {
    const rect = { left: 100, top: 100, width: 200, height: 0 }
    const focal = pointToFocal(200, 100, rect)
    expect(focal).toEqual({ x: 0.5, y: 0.5 })
  })
})
