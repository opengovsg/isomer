import { describe, expect, it } from "vitest"

import {
  MIN_CROP_SIZE,
  clampRectToBounds,
  clientDeltaToNormalized,
  defaultCropRect,
  moveRect,
  resizeRectBottomRight,
} from "./cropGeometry"

describe("cropGeometry", () => {
  describe("clampRectToBounds", () => {
    it("enforces MIN_CROP_SIZE lower bound", () => {
      const rect = { x: 0.5, y: 0.5, width: 0.01, height: 0.01 }
      const clamped = clampRectToBounds(rect)
      expect(clamped.width).toBe(MIN_CROP_SIZE)
      expect(clamped.height).toBe(MIN_CROP_SIZE)
    })

    it("enforces upper bound of 1", () => {
      const rect = { x: 0.5, y: 0.5, width: 1.5, height: 1.5 }
      const clamped = clampRectToBounds(rect)
      expect(clamped.width).toBe(1)
      expect(clamped.height).toBe(1)
    })

    it("shifts x/y when rect would overflow instead of shrinking", () => {
      const rect = { x: 0.8, y: 0.8, width: 0.3, height: 0.3 }
      const clamped = clampRectToBounds(rect)
      // width and height should stay at 0.3 (not shrunk)
      expect(clamped.width).toBe(0.3)
      expect(clamped.height).toBe(0.3)
      // x and y should shift to fit within bounds (0.7 = 1 - 0.3)
      expect(clamped.x).toBe(0.7)
      expect(clamped.y).toBe(0.7)
    })

    it("clamps x/y to [0, 1-size] range", () => {
      const rect = { x: -0.1, y: -0.1, width: 0.2, height: 0.2 }
      const clamped = clampRectToBounds(rect)
      expect(clamped.x).toBe(0)
      expect(clamped.y).toBe(0)
    })

    it("returns normalized rect within unit square", () => {
      const rect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
      const clamped = clampRectToBounds(rect)
      expect(clamped).toEqual(rect)
    })
  })

  describe("moveRect", () => {
    it("translates rect by delta", () => {
      const rect = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 }
      const moved = moveRect(rect, 0.1, 0.1)
      expect(moved.x).toBeCloseTo(0.3)
      expect(moved.y).toBeCloseTo(0.3)
      expect(moved.width).toBeCloseTo(0.3)
      expect(moved.height).toBeCloseTo(0.3)
    })

    it("clamps at left/top edge", () => {
      const rect = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 }
      const moved = moveRect(rect, -0.2, -0.2)
      expect(moved.x).toBe(0)
      expect(moved.y).toBe(0)
    })

    it("clamps at right/bottom edge", () => {
      const rect = { x: 0.6, y: 0.6, width: 0.3, height: 0.3 }
      const moved = moveRect(rect, 0.2, 0.2)
      expect(moved.x).toBe(0.7)
      expect(moved.y).toBe(0.7)
      expect(moved.x + moved.width).toBe(1)
      expect(moved.y + moved.height).toBe(1)
    })

    it("preserves size while moving", () => {
      const rect = { x: 0.2, y: 0.2, width: 0.5, height: 0.4 }
      const moved = moveRect(rect, 0.1, -0.05)
      expect(moved.width).toBe(0.5)
      expect(moved.height).toBe(0.4)
    })
  })

  describe("resizeRectBottomRight", () => {
    it("resizes both dimensions freely without lockedRatio", () => {
      const rect = { x: 0, y: 0, width: 0.2, height: 0.2 }
      const resized = resizeRectBottomRight(rect, 0.7, 0.8, undefined)
      expect(resized.width).toBeCloseTo(0.7)
      expect(resized.height).toBeCloseTo(0.8)
      expect(resized.x).toBe(0)
      expect(resized.y).toBe(0)
    })

    it("derives height from width to preserve lockedRatio", () => {
      const rect = { x: 0, y: 0, width: 0.2, height: 0.2 }
      const ratio = { width: 2, height: 1 } // 2:1 ratio
      const resized = resizeRectBottomRight(rect, 0.8, 0.6, ratio)
      // width should be clamped to 0.8
      // height should be width / ratio = 0.8 / 2 = 0.4
      expect(resized.width).toBeCloseTo(0.8)
      expect(resized.height).toBeCloseTo(0.4)
    })

    it("shifts to height-first resize when width-first would overflow bottom", () => {
      const rect = { x: 0.1, y: 0.6, width: 0.2, height: 0.2 }
      const ratio = { width: 1, height: 1 } // square
      const resized = resizeRectBottomRight(rect, 0.95, 0.95, ratio)
      // pointer would be at (0.95, 0.95)
      // width = 0.95 - 0.1 = 0.85, height = 0.95 - 0.6 = 0.35
      // With 1:1 ratio, height should limit: height = 1 - 0.6 = 0.4
      // then width = height * ratio = 0.4 * 1 = 0.4
      expect(resized.height).toBeLessThanOrEqual(0.4)
      expect(resized.width).toBeCloseTo(resized.height)
    })

    it("enforces MIN_CROP_SIZE", () => {
      const rect = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 }
      const resized = resizeRectBottomRight(rect, 0.51, 0.51, undefined)
      expect(resized.width).toBeGreaterThanOrEqual(MIN_CROP_SIZE)
      expect(resized.height).toBeGreaterThanOrEqual(MIN_CROP_SIZE)
    })

    it("anchors at top-left (x,y unchanged)", () => {
      const rect = { x: 0.3, y: 0.3, width: 0.2, height: 0.2 }
      const resized = resizeRectBottomRight(rect, 0.8, 0.8, undefined)
      expect(resized.x).toBe(0.3)
      expect(resized.y).toBe(0.3)
    })

    it("handles tall ratio (1:2) correctly", () => {
      const rect = { x: 0.25, y: 0.1, width: 0.2, height: 0.2 }
      const ratio = { width: 1, height: 2 }
      const resized = resizeRectBottomRight(rect, 0.6, 0.9, ratio)
      // width first: 0.6 - 0.25 = 0.35, clamped to 1 - 0.25 = 0.75, so 0.35
      // height = width / ratio = 0.35 / 0.5 = 0.7
      // Check within bounds
      expect(resized.x + resized.width).toBeLessThanOrEqual(1)
      expect(resized.y + resized.height).toBeLessThanOrEqual(1)
      expect(resized.width / resized.height).toBeCloseTo(0.5, 1)
    })
  })

  describe("defaultCropRect", () => {
    it("returns full image when no lockedRatio", () => {
      const rect = defaultCropRect(undefined)
      expect(rect).toEqual({ x: 0, y: 0, width: 1, height: 1 })
    })

    it("centers a wide ratio (2:1) filling width", () => {
      const ratio = { width: 2, height: 1 }
      const rect = defaultCropRect(ratio)
      expect(rect.width).toBe(1)
      expect(rect.height).toBeCloseTo(0.5)
      expect(rect.x).toBeCloseTo((1 - 1) / 2) // 0
      expect(rect.y).toBeCloseTo((1 - 0.5) / 2) // 0.25
    })

    it("centers a tall ratio (1:2) filling height", () => {
      const ratio = { width: 1, height: 2 }
      const rect = defaultCropRect(ratio)
      expect(rect.height).toBe(1)
      expect(rect.width).toBeCloseTo(0.5)
      expect(rect.y).toBeCloseTo((1 - 1) / 2) // 0
      expect(rect.x).toBeCloseTo((1 - 0.5) / 2) // 0.25
    })

    it("centers a square ratio", () => {
      const ratio = { width: 1, height: 1 }
      const rect = defaultCropRect(ratio)
      expect(rect.width).toBe(1)
      expect(rect.height).toBe(1)
      expect(rect.x).toBe(0)
      expect(rect.y).toBe(0)
    })

    it("centers a 16:9 ratio", () => {
      const ratio = { width: 16, height: 9 }
      const rect = defaultCropRect(ratio)
      // 16/9 = 1.778
      // Fills width=1, then height = 1 / 1.778 = 0.5625
      expect(rect.width).toBe(1)
      expect(rect.height).toBeCloseTo(9 / 16)
      expect(rect.x).toBeCloseTo(0)
      expect(rect.y).toBeCloseTo((1 - 9 / 16) / 2)
    })
  })

  describe("clientDeltaToNormalized", () => {
    it("converts pixel delta to normalized delta", () => {
      const boxRect = { width: 400, height: 300 }
      const normalized = clientDeltaToNormalized(100, 150, boxRect)
      expect(normalized.dx).toBeCloseTo(0.25)
      expect(normalized.dy).toBeCloseTo(0.5)
    })

    it("guards against zero width", () => {
      const boxRect = { width: 0, height: 300 }
      const normalized = clientDeltaToNormalized(100, 150, boxRect)
      expect(normalized.dx).toBe(0)
      expect(normalized.dy).toBeCloseTo(0.5)
    })

    it("guards against zero height", () => {
      const boxRect = { width: 400, height: 0 }
      const normalized = clientDeltaToNormalized(100, 150, boxRect)
      expect(normalized.dx).toBeCloseTo(0.25)
      expect(normalized.dy).toBe(0)
    })

    it("handles negative deltas", () => {
      const boxRect = { width: 400, height: 300 }
      const normalized = clientDeltaToNormalized(-50, -75, boxRect)
      expect(normalized.dx).toBeCloseTo(-0.125)
      expect(normalized.dy).toBeCloseTo(-0.25)
    })

    it("handles zero delta", () => {
      const boxRect = { width: 400, height: 300 }
      const normalized = clientDeltaToNormalized(0, 0, boxRect)
      expect(normalized.dx).toBe(0)
      expect(normalized.dy).toBe(0)
    })
  })
})
