import { describe, expect, it } from "vitest"

import { bakeImage, bakeImageWithinSizeLimit } from "./imageBake"

type Rgb = [number, number, number]

const RED: Rgb = [255, 0, 0]
const GREEN: Rgb = [0, 255, 0]
const BLUE: Rgb = [0, 0, 255]
const WHITE: Rgb = [255, 255, 255]

// Build a tiny lossless PNG blob from row-major pixels (index = y*width + x).
const makeImageBlob = async (
  width: number,
  height: number,
  pixels: Rgb[],
): Promise<Blob> => {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  const imageData = ctx.createImageData(width, height)
  pixels.forEach(([r, g, b], i) => {
    imageData.data[i * 4] = r
    imageData.data[i * 4 + 1] = g
    imageData.data[i * 4 + 2] = b
    imageData.data[i * 4 + 3] = 255
  })
  ctx.putImageData(imageData, 0, 0)
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob null"))),
      "image/png",
    ),
  )
}

// Decode a baked blob back into addressable pixels.
const readPixels = async (blob: Blob) => {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.drawImage(bitmap, 0, 0)
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  return {
    width: bitmap.width,
    height: bitmap.height,
    at: (x: number, y: number): Rgb => {
      const i = (y * bitmap.width + x) * 4
      return [data[i]!, data[i + 1]!, data[i + 2]!]
    },
  }
}

const FULL_CROP = { x: 0, y: 0, width: 1, height: 1 }
const PNG = { mimeType: "image/png" }

// Covers the canvas composition that bakeImage actually ships (crop, then a
// full-image draw) — the pure helpers it used to lean on no longer reflect
// the real output.
describe("bakeImage composition", () => {
  it("passes a full-crop image through unchanged", async () => {
    const src = await makeImageBlob(2, 1, [RED, BLUE])
    const baked = await bakeImage(src, { crop: FULL_CROP }, PNG)
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([2, 1])
    expect(out.at(0, 0)).toEqual(RED)
    expect(out.at(1, 0)).toEqual(BLUE)
  })

  it("crops: keeping the right half drops the left pixels", async () => {
    const src = await makeImageBlob(4, 1, [RED, GREEN, BLUE, WHITE])
    const baked = await bakeImage(
      src,
      { crop: { x: 0.5, y: 0, width: 0.5, height: 1 } },
      PNG,
    )
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([2, 1])
    expect(out.at(0, 0)).toEqual(BLUE)
    expect(out.at(1, 0)).toEqual(WHITE)
  })

  it("throws for a non-bakeable MIME type before touching the canvas", async () => {
    const src = await makeImageBlob(2, 1, [RED, BLUE])
    await expect(
      bakeImage(src, { crop: FULL_CROP }, { mimeType: "image/avif" }),
    ).rejects.toThrow(/Cannot bake image format/)
  })

  it("crops: keeping the bottom half drops the top pixels", async () => {
    const src = await makeImageBlob(1, 4, [RED, GREEN, BLUE, WHITE]) // 1 wide, 4 tall
    const baked = await bakeImage(
      src,
      { crop: { x: 0, y: 0.5, width: 1, height: 0.5 } },
      PNG,
    )
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([1, 2])
    expect(out.at(0, 0)).toEqual(BLUE)
    expect(out.at(0, 1)).toEqual(WHITE)
  })

  it("throws for an animated source, without relying on the caller to check first", () => {
    // A minimal (undecoded) WebP header with the VP8X animation flag set --
    // enough for isAnimatedImageBlob to detect, without needing a real
    // decodable image, since bakeImage must reject this before ever calling
    // createImageBitmap.
    const header = new Uint8Array(30) // is-animated needs >= 30 bytes
    header.set([0x52, 0x49, 0x46, 0x46], 0) // "RIFF"
    header.set([0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
    header.set([0x56, 0x50, 0x38, 0x58], 12) // "VP8X"
    header[20] = 0x02 // animation flag
    const animatedWebp = new Blob([header], { type: "image/webp" })

    return expect(
      bakeImage(animatedWebp, { crop: FULL_CROP }, { mimeType: "image/webp" }),
    ).rejects.toThrow(/animated/)
  })
})

// Noisy (non-uniform) pixels so JPEG quality actually changes the encoded
// byte count -- a flat-color image compresses to roughly the same tiny size
// at every quality level, which would make the back-off assertions vacuous.
const makeNoisyImageBlob = async (size: number): Promise<Blob> => {
  const pixels: Rgb[] = Array.from({ length: size * size }, (_, i) => [
    (i * 37) % 256,
    (i * 91) % 256,
    (i * 149) % 256,
  ])
  return makeImageBlob(size, size, pixels)
}

describe("bakeImageWithinSizeLimit", () => {
  it("returns the full-quality bake unchanged when it already fits", async () => {
    const src = await makeNoisyImageBlob(16)
    const fullQuality = await bakeImage(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg" },
    )
    const result = await bakeImageWithinSizeLimit(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg", maxBytes: fullQuality.size },
    )
    expect(result.size).toBe(fullQuality.size)
  })

  it("backs off JPEG quality until the bake fits under maxBytes", async () => {
    const src = await makeNoisyImageBlob(64)
    const fullQuality = await bakeImage(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg" },
    )
    // A threshold between full quality and the lowest backoff step's size --
    // only reachable by actually backing off, not by the full-quality bake.
    const maxBytes = Math.floor(fullQuality.size * 0.7)
    const result = await bakeImageWithinSizeLimit(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg", maxBytes },
    )
    expect(result.type).toBe("image/jpeg")
    expect(result.size).toBeLessThanOrEqual(maxBytes)
    expect(result.size).toBeLessThan(fullQuality.size)
  })

  it("returns the full-quality PNG unchanged when still oversize (no quality knob to back off)", async () => {
    const src = await makeNoisyImageBlob(16)
    const fullQuality = await bakeImage(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/png" },
    )
    const result = await bakeImageWithinSizeLimit(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/png", maxBytes: 1 },
    )
    expect(result.size).toBe(fullQuality.size)
  })

  it("returns its smallest attempt when even the lowest JPEG quality step is still oversize", async () => {
    const src = await makeNoisyImageBlob(64)
    const lowestQuality = await bakeImage(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg", quality: 0.4 },
    )
    const result = await bakeImageWithinSizeLimit(
      src,
      { crop: FULL_CROP },
      { mimeType: "image/jpeg", maxBytes: 1 },
    )
    expect(result.size).toBe(lowestQuality.size)
  })
})
