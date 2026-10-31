import { describe, it, expect } from "vitest"

import {
  canBakeImage,
  cropRectToPixels,
  computeCanvasTransform,
  isAnimatedWebp,
  isAnimatedPng,
  isAnimatedImageBytes,
  type CropRect,
} from "./imageBake"

const asciiBytes = (s: string): number[] => [...s].map((c) => c.charCodeAt(0))

// Build a PNG chunk: 4-byte big-endian length, 4-byte type, data, 4-byte CRC
// (CRC is zero-filled; the sniffer doesn't validate it).
const pngChunk = (type: string, dataLength: number): number[] => [
  (dataLength >>> 24) & 0xff,
  (dataLength >>> 16) & 0xff,
  (dataLength >>> 8) & 0xff,
  dataLength & 0xff,
  ...asciiBytes(type),
  ...new Array<number>(dataLength).fill(0),
  0,
  0,
  0,
  0,
]

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

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

  it("never lets sx+sw exceed srcWidth on an odd-dimension source", () => {
    // Regression test: rounding x and width independently could overflow --
    // a 3px-wide source with x=0.5/width=0.5 independently rounds to sx=2,
    // sw=2 (sx+sw=4, overflowing the 3px source).
    const crop: CropRect = { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    const result = cropRectToPixels(crop, 3, 3)
    expect(result.sx + result.sw).toBeLessThanOrEqual(3)
    expect(result.sy + result.sh).toBeLessThanOrEqual(3)
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

describe("isAnimatedWebp", () => {
  const header = (chunk: string, flags: number): number[] => [
    ...asciiBytes("RIFF"),
    0,
    0,
    0,
    0,
    ...asciiBytes("WEBP"),
    ...asciiBytes(chunk),
    10,
    0,
    0,
    0,
    flags,
    ...new Array<number>(10).fill(0),
  ]

  it("returns true for an extended WebP with the animation flag set", () => {
    expect(isAnimatedWebp(Uint8Array.from(header("VP8X", 0x02)))).toBe(true)
  })

  it("returns false for an extended WebP without the animation flag", () => {
    expect(isAnimatedWebp(Uint8Array.from(header("VP8X", 0x10)))).toBe(false)
  })

  it("returns false for a non-extended (static) WebP", () => {
    expect(isAnimatedWebp(Uint8Array.from(header("VP8 ", 0x02)))).toBe(false)
  })

  it("returns false for non-WebP bytes", () => {
    expect(isAnimatedWebp(Uint8Array.from([1, 2, 3]))).toBe(false)
  })
})

describe("isAnimatedPng", () => {
  it("returns true when acTL precedes IDAT (APNG)", () => {
    const apng = Uint8Array.from([
      ...PNG_SIGNATURE,
      ...pngChunk("IHDR", 13),
      ...pngChunk("acTL", 8),
      ...pngChunk("IDAT", 4),
    ])
    expect(isAnimatedPng(apng)).toBe(true)
  })

  it("returns false for a static PNG (no acTL)", () => {
    const png = Uint8Array.from([
      ...PNG_SIGNATURE,
      ...pngChunk("IHDR", 13),
      ...pngChunk("IDAT", 4),
    ])
    expect(isAnimatedPng(png)).toBe(false)
  })

  it("returns false for non-PNG bytes", () => {
    expect(isAnimatedPng(Uint8Array.from([1, 2, 3]))).toBe(false)
  })
})

describe("isAnimatedImageBytes", () => {
  it("sniffs WebP by MIME", () => {
    const animated = Uint8Array.from([
      ...asciiBytes("RIFF"),
      0,
      0,
      0,
      0,
      ...asciiBytes("WEBP"),
      ...asciiBytes("VP8X"),
      10,
      0,
      0,
      0,
      0x02,
      ...new Array<number>(10).fill(0),
    ])
    expect(isAnimatedImageBytes("image/webp", animated)).toBe(true)
  })

  it("sniffs PNG by MIME", () => {
    const apng = Uint8Array.from([
      ...PNG_SIGNATURE,
      ...pngChunk("acTL", 8),
      ...pngChunk("IDAT", 4),
    ])
    expect(isAnimatedImageBytes("image/png", apng)).toBe(true)
  })

  it("returns false for formats that can't animate (JPEG)", () => {
    expect(isAnimatedImageBytes("image/jpeg", Uint8Array.from([1, 2, 3]))).toBe(
      false,
    )
  })
})
