import { describe, it, expect } from "vitest"

import {
  canBakeImage,
  cropRectToPixels,
  isAnimatedImageBlob,
  type CropRect,
} from "./imageBake"

// A minimal GIF with `frameCount` frames (no color tables, 1x1 frames) — enough
// structure for the block-walking sniffer, not a decodable image.
const gifBytes = (frameCount: number): Uint8Array<ArrayBuffer> => {
  // "GIF89a" + logical screen descriptor (1x1, no global color table).
  const header = [...asciiBytes("GIF89a"), 1, 0, 1, 0, 0x00, 0, 0]
  // Image Separator + 2,2,2,2 descriptor fields + packed(no LCT), LZW size, end.
  const frame = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x00, 0x02, 0x00]
  const out = [...header]
  for (let i = 0; i < frameCount; i++) out.push(...frame)
  out.push(0x3b) // trailer
  return Uint8Array.from(out)
}

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

describe("isAnimatedImageBlob", () => {
  const webp = (chunk: string, flags: number) =>
    Uint8Array.from([
      ...asciiBytes("RIFF"),
      ...[0, 0, 0, 0],
      ...asciiBytes("WEBP"),
      ...asciiBytes(chunk),
      ...[10, 0, 0, 0],
      flags,
      ...new Array<number>(10).fill(0),
    ])
  const check = (bytes: Uint8Array<ArrayBuffer>) =>
    isAnimatedImageBlob(new Blob([bytes]))

  it("is true for an extended WebP with the animation flag set", async () => {
    expect(await check(webp("VP8X", 0x02))).toBe(true)
  })

  it("is false for a WebP without the animation flag or extended header", async () => {
    expect(await check(webp("VP8X", 0x10))).toBe(false)
    expect(await check(webp("VP8 ", 0x02))).toBe(false)
  })

  it("is true for an APNG (acTL, then a frame in IDAT and one in fdAT)", async () => {
    const apng = Uint8Array.from([
      ...PNG_SIGNATURE,
      ...pngChunk("IHDR", 13),
      ...pngChunk("acTL", 8),
      ...pngChunk("fcTL", 26),
      ...pngChunk("IDAT", 4),
      ...pngChunk("fcTL", 26),
      ...pngChunk("fdAT", 8),
    ])
    expect(await check(apng)).toBe(true)
  })

  it("is false for a static PNG (no acTL)", async () => {
    const png = Uint8Array.from([
      ...PNG_SIGNATURE,
      ...pngChunk("IHDR", 13),
      ...pngChunk("IDAT", 4),
    ])
    expect(await check(png)).toBe(false)
  })

  it("is false, without throwing, for a truncated PNG", async () => {
    // Signature plus 2 stray bytes: too short to hold a chunk length.
    expect(await check(Uint8Array.from([...PNG_SIGNATURE, 0, 0]))).toBe(false)
  })

  it("is true for a multi-frame GIF and false for a single-frame one", async () => {
    expect(await check(gifBytes(2))).toBe(true)
    expect(await check(gifBytes(1))).toBe(false)
  })

  it("is false for bytes that aren't WebP/PNG/GIF (e.g. JPEG)", async () => {
    expect(await check(Uint8Array.from([1, 2, 3]))).toBe(false)
  })
})
