import { describe, expect, it } from "vitest"

import { bakeImage } from "./imageBake"

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

// Covers the canvas composition that bakeImage actually ships (display-space
// crop, full-image draw, rotate/flip transform) — the pure helpers it used to
// lean on no longer reflect the real output.
describe("bakeImage composition", () => {
  it("passes a full-crop, un-rotated image through unchanged", async () => {
    const src = await makeImageBlob(2, 1, [RED, BLUE])
    const baked = await bakeImage(
      src,
      { crop: FULL_CROP, rotate: 0, flipH: false, flipV: false },
      PNG,
    )
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([2, 1])
    expect(out.at(0, 0)).toEqual(RED)
    expect(out.at(1, 0)).toEqual(BLUE)
  })

  it("rotates 90° clockwise: a 2×1 (left/right) becomes a 1×2 (top/bottom)", async () => {
    const src = await makeImageBlob(2, 1, [RED, BLUE])
    const baked = await bakeImage(
      src,
      { crop: FULL_CROP, rotate: 90, flipH: false, flipV: false },
      PNG,
    )
    const out = await readPixels(baked)
    // 90° swaps the dimensions, and the left edge rotates to the top.
    expect([out.width, out.height]).toEqual([1, 2])
    expect(out.at(0, 0)).toEqual(RED)
    expect(out.at(0, 1)).toEqual(BLUE)
  })

  it("flips horizontally: left/right are mirrored", async () => {
    const src = await makeImageBlob(2, 1, [RED, BLUE])
    const baked = await bakeImage(
      src,
      { crop: FULL_CROP, rotate: 0, flipH: true, flipV: false },
      PNG,
    )
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([2, 1])
    expect(out.at(0, 0)).toEqual(BLUE)
    expect(out.at(1, 0)).toEqual(RED)
  })

  it("crops in display space: keeping the right half drops the left pixels", async () => {
    const src = await makeImageBlob(4, 1, [RED, GREEN, BLUE, WHITE])
    const baked = await bakeImage(
      src,
      {
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        rotate: 0,
        flipH: false,
        flipV: false,
      },
      PNG,
    )
    const out = await readPixels(baked)
    expect([out.width, out.height]).toEqual([2, 1])
    expect(out.at(0, 0)).toEqual(BLUE)
    expect(out.at(1, 0)).toEqual(WHITE)
  })
})
