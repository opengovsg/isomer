import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { bakeImage } from "./imageBake"

// bakeImage needs a real Canvas/createImageBitmap, so this runs in real
// Chromium (Vitest Browser Mode) rather than the simulated "node" project —
// see vitest.config.ts's BROWSER_TEST_PATTERN.

type Adjustment = Pick<ImageAdjustment, "crop">

const baseAdjustment = (overrides: Partial<Adjustment> = {}): Adjustment => ({
  crop: { x: 0, y: 0, width: 1, height: 1 },
  ...overrides,
})

const blobFromCanvas = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("canvas.toBlob returned null"))
      else resolve(blob)
    }, "image/png")
  })

// 4x4 image, one solid color per 2x2 quadrant — lets crop be verified by
// sampling a single pixel per quadrant, with no anti-aliasing
// since every fill lands on exact pixel boundaries.
const RED = [255, 0, 0, 255]
const GREEN = [0, 255, 0, 255]
const BLUE = [0, 0, 255, 255]
const YELLOW = [255, 255, 0, 255]

const createQuadrantImage = (): Promise<Blob> => {
  const canvas = document.createElement("canvas")
  canvas.width = 4
  canvas.height = 4
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.fillStyle = `rgb(${RED.slice(0, 3).join(",")})`
  ctx.fillRect(0, 0, 2, 2) // top-left
  ctx.fillStyle = `rgb(${GREEN.slice(0, 3).join(",")})`
  ctx.fillRect(2, 0, 2, 2) // top-right
  ctx.fillStyle = `rgb(${BLUE.slice(0, 3).join(",")})`
  ctx.fillRect(0, 2, 2, 2) // bottom-left
  ctx.fillStyle = `rgb(${YELLOW.slice(0, 3).join(",")})`
  ctx.fillRect(2, 2, 2, 2) // bottom-right
  return blobFromCanvas(canvas)
}

const getPixel = async (
  blob: Blob,
  x: number,
  y: number,
): Promise<number[]> => {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.drawImage(bitmap, 0, 0)
  return Array.from(ctx.getImageData(x, y, 1, 1).data)
}

describe("bakeImage", () => {
  it("throws for a non-bakeable MIME type before touching the canvas", async () => {
    const original = await createQuadrantImage()
    await expect(
      bakeImage(original, baseAdjustment(), { mimeType: "image/avif" }),
    ).rejects.toThrow(/Cannot bake image format/)
  })

  it("crops to the requested normalized region", async () => {
    const original = await createQuadrantImage()
    const baked = await bakeImage(
      original,
      baseAdjustment({ crop: { x: 0, y: 0, width: 0.5, height: 0.5 } }),
      { mimeType: "image/png" },
    )
    const bitmap = await createImageBitmap(baked)
    expect(bitmap.width).toBe(2)
    expect(bitmap.height).toBe(2)
    expect(await getPixel(baked, 0, 0)).toEqual(RED)
  })

  it("throws for an animated source, without relying on the caller to check first", () => {
    // A minimal (undecoded) WebP header with the VP8X animation flag set --
    // enough for isAnimatedImageBlob to detect, without needing a real
    // decodable image, since bakeImage must reject this before ever calling
    // createImageBitmap.
    const header = new Uint8Array(21)
    header.set([0x52, 0x49, 0x46, 0x46], 0) // "RIFF"
    header.set([0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
    header.set([0x56, 0x50, 0x38, 0x58], 12) // "VP8X"
    header[20] = 0x02 // animation flag
    const animatedWebp = new Blob([header], { type: "image/webp" })

    return expect(
      bakeImage(animatedWebp, baseAdjustment(), { mimeType: "image/webp" }),
    ).rejects.toThrow(/animated/)
  })
})
