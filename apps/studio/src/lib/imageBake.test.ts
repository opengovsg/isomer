import { describe, it, expect } from "vitest"

import {
  canBakeImage,
  cropRectToPixels,
  outputDimensions,
  computeCanvasTransform,
  type CropRect,
} from "./imageBake"

describe("canBakeImage", () => {
  it("returns true for JPEG", () => {
    expect(canBakeImage("image/jpeg")).toBe(true)
  })

  it("returns true for PNG", () => {
    expect(canBakeImage("image/png")).toBe(true)
  })

  it("returns true for WebP", () => {
    expect(canBakeImage("image/webp")).toBe(true)
  })

  it("returns false for SVG", () => {
    expect(canBakeImage("image/svg+xml")).toBe(false)
  })

  it("returns false for GIF", () => {
    expect(canBakeImage("image/gif")).toBe(false)
  })

  it("returns false for AVIF", () => {
    expect(canBakeImage("image/avif")).toBe(false)
  })

  it("returns false for BMP", () => {
    expect(canBakeImage("image/bmp")).toBe(false)
  })

  it("returns false for unknown format", () => {
    expect(canBakeImage("image/unknown")).toBe(false)
  })
})

describe("cropRectToPixels", () => {
  it("converts normalized crop to pixel coordinates", () => {
    const crop: CropRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
    const result = cropRectToPixels(crop, 1000, 800)

    expect(result).toEqual({
      sx: 250,
      sy: 200,
      sw: 500,
      sh: 400,
    })
  })

  it("handles full-image crop (0,0,1,1)", () => {
    const crop: CropRect = { x: 0, y: 0, width: 1, height: 1 }
    const result = cropRectToPixels(crop, 1000, 800)

    expect(result).toEqual({
      sx: 0,
      sy: 0,
      sw: 1000,
      sh: 800,
    })
  })

  it("handles offset crop at 0.5, 0.5", () => {
    const crop: CropRect = { x: 0.5, y: 0.5, width: 0.3, height: 0.4 }
    const result = cropRectToPixels(crop, 1000, 800)

    expect(result).toEqual({
      sx: 500,
      sy: 400,
      sw: 300,
      sh: 320,
    })
  })

  it("rounds pixel values correctly", () => {
    const crop: CropRect = { x: 0.123, y: 0.456, width: 0.333, height: 0.444 }
    const result = cropRectToPixels(crop, 1000, 1000)

    expect(result).toEqual({
      sx: 123,
      sy: 456,
      sw: 333,
      sh: 444,
    })
  })

  it("handles small source dimensions", () => {
    const crop: CropRect = { x: 0.2, y: 0.3, width: 0.6, height: 0.4 }
    const result = cropRectToPixels(crop, 100, 100)

    expect(result).toEqual({
      sx: 20,
      sy: 30,
      sw: 60,
      sh: 40,
    })
  })
})

describe("outputDimensions", () => {
  it("preserves dimensions for 0 degree rotation", () => {
    const result = outputDimensions(800, 600, 0)
    expect(result).toEqual({ width: 800, height: 600 })
  })

  it("preserves dimensions for 180 degree rotation", () => {
    const result = outputDimensions(800, 600, 180)
    expect(result).toEqual({ width: 800, height: 600 })
  })

  it("swaps dimensions for 90 degree rotation", () => {
    const result = outputDimensions(800, 600, 90)
    expect(result).toEqual({ width: 600, height: 800 })
  })

  it("swaps dimensions for 270 degree rotation", () => {
    const result = outputDimensions(800, 600, 270)
    expect(result).toEqual({ width: 600, height: 800 })
  })

  it("handles square dimensions", () => {
    const result = outputDimensions(500, 500, 90)
    expect(result).toEqual({ width: 500, height: 500 })
  })

  it("handles very small dimensions", () => {
    const result = outputDimensions(1, 2, 90)
    expect(result).toEqual({ width: 2, height: 1 })
  })

  it("handles very large dimensions", () => {
    const result = outputDimensions(4000, 3000, 270)
    expect(result).toEqual({ width: 3000, height: 4000 })
  })
})

describe("computeCanvasTransform", () => {
  it("returns identity transform for no rotation, no flip", () => {
    const result = computeCanvasTransform(0, false, false)

    expect(result).toEqual({
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
    })
  })

  it("returns correct transform for horizontal flip only", () => {
    const result = computeCanvasTransform(0, true, false)

    expect(result).toEqual({
      rotate: 0,
      scaleX: -1,
      scaleY: 1,
    })
  })

  it("returns correct transform for vertical flip only", () => {
    const result = computeCanvasTransform(0, false, true)

    expect(result).toEqual({
      rotate: 0,
      scaleX: 1,
      scaleY: -1,
    })
  })

  it("returns correct transform for both horizontal and vertical flip", () => {
    const result = computeCanvasTransform(0, true, true)

    expect(result).toEqual({
      rotate: 0,
      scaleX: -1,
      scaleY: -1,
    })
  })

  it("returns correct transform for 90 degree rotation only", () => {
    const result = computeCanvasTransform(90, false, false)

    expect(result).toEqual({
      rotate: 90,
      scaleX: 1,
      scaleY: 1,
    })
  })

  it("returns correct transform for 90 rotation with horizontal flip", () => {
    const result = computeCanvasTransform(90, true, false)

    expect(result).toEqual({
      rotate: 90,
      scaleX: -1,
      scaleY: 1,
    })
  })

  it("returns correct transform for 90 rotation with vertical flip", () => {
    const result = computeCanvasTransform(90, false, true)

    expect(result).toEqual({
      rotate: 90,
      scaleX: 1,
      scaleY: -1,
    })
  })

  it("returns correct transform for 180 degree rotation", () => {
    const result = computeCanvasTransform(180, false, false)

    expect(result).toEqual({
      rotate: 180,
      scaleX: 1,
      scaleY: 1,
    })
  })

  it("returns correct transform for 180 rotation with horizontal flip", () => {
    const result = computeCanvasTransform(180, true, false)

    expect(result).toEqual({
      rotate: 180,
      scaleX: -1,
      scaleY: 1,
    })
  })

  it("returns correct transform for 270 degree rotation", () => {
    const result = computeCanvasTransform(270, false, false)

    expect(result).toEqual({
      rotate: 270,
      scaleX: 1,
      scaleY: 1,
    })
  })

  it("returns correct transform for 270 rotation with both flips", () => {
    const result = computeCanvasTransform(270, true, true)

    expect(result).toEqual({
      rotate: 270,
      scaleX: -1,
      scaleY: -1,
    })
  })
})
