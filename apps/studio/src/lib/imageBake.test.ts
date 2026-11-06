import { describe, it, expect } from "vitest"

import {
  canBakeImage,
  cropRectToPixels,
  isAnimatedWebp,
  isAnimatedPng,
  type CropRect,
} from "./imageBake"

// Minimal valid (extended-format) WebP header with the VP8X animation flag
// either set or clear -- just enough bytes for isAnimatedWebp's own reader,
// not a decodable image.
const makeWebpHeader = (animated: boolean): Uint8Array => {
  const bytes = new Uint8Array(21)
  bytes.set([0x52, 0x49, 0x46, 0x46], 0) // "RIFF"
  bytes.set([0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  bytes.set([0x56, 0x50, 0x38, 0x58], 12) // "VP8X"
  bytes[20] = animated ? 0x02 : 0x00
  return bytes
}

// Minimal valid PNG byte stream: signature, then either an "acTL" chunk
// before "IDAT" (animated/APNG) or straight to "IDAT" (static) -- chunk
// data/CRC bytes are irrelevant to isAnimatedPng's chunk walk, so each
// chunk's length is 0.
const makeChunk = (type: string): number[] => {
  const typeBytes = Array.from(type, (c) => c.charCodeAt(0))
  return [0, 0, 0, 0, ...typeBytes, 0, 0, 0, 0] // length(0) + type + crc(0)
}
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const makePng = (animated: boolean): Uint8Array =>
  new Uint8Array([
    ...PNG_SIGNATURE,
    ...(animated ? makeChunk("acTL") : []),
    ...makeChunk("IDAT"),
  ])

describe("isAnimatedWebp", () => {
  it("returns true for an extended-format WebP with the animation flag set", () => {
    expect(isAnimatedWebp(makeWebpHeader(true))).toBe(true)
  })

  it("returns false for an extended-format WebP without the animation flag", () => {
    expect(isAnimatedWebp(makeWebpHeader(false))).toBe(false)
  })

  it("returns false for a non-WebP byte stream", () => {
    expect(isAnimatedWebp(new Uint8Array(21))).toBe(false)
  })
})

describe("isAnimatedPng", () => {
  it("returns true for a PNG with an acTL chunk before IDAT", () => {
    expect(isAnimatedPng(makePng(true))).toBe(true)
  })

  it("returns false for a static PNG (IDAT with no preceding acTL)", () => {
    expect(isAnimatedPng(makePng(false))).toBe(false)
  })

  it("returns false for a non-PNG byte stream", () => {
    expect(isAnimatedPng(new Uint8Array(8))).toBe(false)
  })
})

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

  it("never rounds a positive crop down to a zero-pixel width or height", () => {
    // Regression test: a crop narrower than half a source pixel (e.g. 5% of
    // a 5px-wide source) independently rounded width/height to 0, which
    // reaches canvas as a zero-sized, undraw-able region.
    const crop: CropRect = { x: 0, y: 0, width: 0.05, height: 0.05 }
    const result = cropRectToPixels(crop, 5, 5)
    expect(result.sw).toBeGreaterThanOrEqual(1)
    expect(result.sh).toBeGreaterThanOrEqual(1)
  })

  it("keeps a right/bottom-edge crop within the source bounds", () => {
    // A crop whose normalized start is already at (or past) the edge must
    // still clamp to a valid, non-overflowing pixel rect.
    const crop: CropRect = { x: 1, y: 1, width: 0.1, height: 0.1 }
    const result = cropRectToPixels(crop, 10, 10)
    expect(result.sx + result.sw).toBeLessThanOrEqual(10)
    expect(result.sy + result.sh).toBeLessThanOrEqual(10)
    expect(result.sw).toBeGreaterThanOrEqual(1)
    expect(result.sh).toBeGreaterThanOrEqual(1)
  })

  it("returns a zero-size rect for a zero-area crop, without clamping it to 1px", () => {
    const crop: CropRect = { x: 0.5, y: 0.5, width: 0, height: 0 }
    const result = cropRectToPixels(crop, 100, 100)
    expect(result.sw).toBe(0)
    expect(result.sh).toBe(0)
  })
})
