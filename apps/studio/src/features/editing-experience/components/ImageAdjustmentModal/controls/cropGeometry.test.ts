import { describe, expect, it } from "vitest"

import {
  CORNER_HANDLES,
  EDGE_HANDLES,
  MIN_CROP_SIZE,
  clampRectToBounds,
  clientDeltaToNormalized,
  defaultCropRect,
  getContainedImageBounds,
  moveRect,
  resizeRectByHandle,
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

  describe("resizeRectByHandle", () => {
    it("exposes 4 corner handles and 4 edge handles", () => {
      expect(CORNER_HANDLES).toEqual(
        expect.arrayContaining(["nw", "ne", "se", "sw"]),
      )
      expect(EDGE_HANDLES).toEqual(expect.arrayContaining(["n", "e", "s", "w"]))
    })

    it("se resizes both dimensions freely, anchored at top-left", () => {
      const rect = { x: 0, y: 0, width: 0.2, height: 0.2 }
      const resized = resizeRectByHandle(rect, "se", 0.7, 0.8, undefined)
      expect(resized.width).toBeCloseTo(0.7)
      expect(resized.height).toBeCloseTo(0.8)
      expect(resized.x).toBe(0)
      expect(resized.y).toBe(0)
    })

    it("nw resizes both dimensions, anchored at the opposite (bottom-right) corner", () => {
      const rect = { x: 0.3, y: 0.3, width: 0.2, height: 0.2 }
      const resized = resizeRectByHandle(rect, "nw", 0.1, 0.1, undefined)
      // bottom-right corner (0.5, 0.5) must stay fixed
      expect(resized.x + resized.width).toBeCloseTo(0.5)
      expect(resized.y + resized.height).toBeCloseTo(0.5)
      expect(resized.x).toBeCloseTo(0.1)
      expect(resized.y).toBeCloseTo(0.1)
    })

    it("e resizes width only, anchored at the left edge", () => {
      const rect = { x: 0.2, y: 0.2, width: 0.2, height: 0.3 }
      const resized = resizeRectByHandle(rect, "e", 0.7, 0.9, undefined)
      expect(resized.x).toBe(0.2)
      expect(resized.y).toBe(0.2)
      expect(resized.height).toBe(0.3)
      expect(resized.width).toBeCloseTo(0.5)
    })

    it("s resizes height only, anchored at the top edge", () => {
      const rect = { x: 0.2, y: 0.2, width: 0.3, height: 0.2 }
      const resized = resizeRectByHandle(rect, "s", 0.1, 0.6, undefined)
      expect(resized.x).toBe(0.2)
      expect(resized.y).toBe(0.2)
      expect(resized.width).toBe(0.3)
      expect(resized.height).toBeCloseTo(0.4)
    })

    it("derives height from width to preserve a locked ratio (se)", () => {
      const rect = { x: 0, y: 0, width: 0.2, height: 0.2 }
      const ratio = { width: 2, height: 1 } // 2:1 ratio
      const resized = resizeRectByHandle(rect, "se", 0.8, 0.6, ratio)
      expect(resized.width).toBeCloseTo(0.8)
      expect(resized.height).toBeCloseTo(0.4)
      expect(resized.x).toBe(0)
      expect(resized.y).toBe(0)
    })

    it("preserves a locked ratio for nw, anchored at the opposite corner", () => {
      const rect = { x: 0.3, y: 0.3, width: 0.2, height: 0.2 }
      const ratio = { width: 2, height: 1 }
      const resized = resizeRectByHandle(rect, "nw", 0.0, 0.0, ratio)
      expect(resized.width / resized.height).toBeCloseTo(2)
      expect(resized.x + resized.width).toBeCloseTo(0.5)
      expect(resized.y + resized.height).toBeCloseTo(0.5)
    })

    it("clamps the ratio-derived dimension when it would overflow the image bounds", () => {
      const rect = { x: 0.1, y: 0.6, width: 0.2, height: 0.2 }
      const ratio = { width: 1, height: 1 } // square
      const resized = resizeRectByHandle(rect, "se", 0.95, 0.95, ratio)
      // anchored at (0.1, 0.6); room to bottom is 1-0.6=0.4, so height caps at 0.4
      expect(resized.height).toBeLessThanOrEqual(0.4)
      expect(resized.width).toBeCloseTo(resized.height)
      expect(resized.x + resized.width).toBeLessThanOrEqual(1)
      expect(resized.y + resized.height).toBeLessThanOrEqual(1)
    })

    it("enforces MIN_CROP_SIZE", () => {
      const rect = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 }
      const resized = resizeRectByHandle(rect, "se", 0.51, 0.51, undefined)
      expect(resized.width).toBeGreaterThanOrEqual(MIN_CROP_SIZE)
      expect(resized.height).toBeGreaterThanOrEqual(MIN_CROP_SIZE)
    })

    it("clamps pointer coordinates outside [0, 1]", () => {
      const rect = { x: 0.3, y: 0.3, width: 0.2, height: 0.2 }
      const resized = resizeRectByHandle(rect, "se", 2, 2, undefined)
      expect(resized.x + resized.width).toBeLessThanOrEqual(1)
      expect(resized.y + resized.height).toBeLessThanOrEqual(1)
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

  describe("getContainedImageBounds", () => {
    it("fills the box exactly when aspect ratios match", () => {
      const bounds = getContainedImageBounds({ width: 400, height: 300 }, 4 / 3)
      expect(bounds).toEqual({ x: 0, y: 0, width: 1, height: 1 })
    })

    it("pillarboxes (blank left/right) when the image is narrower than the box", () => {
      // Box is a wide 2:1, image is a portrait 1:2 — image fills height only.
      const bounds = getContainedImageBounds({ width: 400, height: 200 }, 0.5)
      expect(bounds.y).toBe(0)
      expect(bounds.height).toBe(1)
      expect(bounds.width).toBeCloseTo(0.25)
      expect(bounds.x).toBeCloseTo(0.375)
    })

    it("letterboxes (blank top/bottom) when the image is wider than the box", () => {
      // Box is a square, image is a wide 4:1 — image fills width only.
      const bounds = getContainedImageBounds({ width: 300, height: 300 }, 4)
      expect(bounds.x).toBe(0)
      expect(bounds.width).toBe(1)
      expect(bounds.height).toBeCloseTo(0.25)
      expect(bounds.y).toBeCloseTo(0.375)
    })

    it("falls back to the full box when dimensions are unknown", () => {
      expect(getContainedImageBounds({ width: 0, height: 0 }, 1)).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      })
    })
  })
})
