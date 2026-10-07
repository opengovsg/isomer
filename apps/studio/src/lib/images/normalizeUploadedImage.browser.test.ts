import exifr from "exifr"
import { describe, expect, it } from "vitest"

import {
  canvasForBitmap,
  normalizeUploadedImage,
} from "./normalizeUploadedImage"

const quadrantJpeg = async (width: number, height: number): Promise<Blob> => {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not draw a fixture image")

  const halfWidth = width / 2
  const halfHeight = height / 2
  context.fillStyle = "rgb(220, 20, 20)"
  context.fillRect(0, 0, halfWidth, halfHeight)
  context.fillStyle = "rgb(20, 180, 40)"
  context.fillRect(halfWidth, 0, halfWidth, halfHeight)
  context.fillStyle = "rgb(20, 40, 210)"
  context.fillRect(0, halfHeight, halfWidth, halfHeight)
  context.fillStyle = "rgb(245, 245, 245)"
  context.fillRect(halfWidth, halfHeight, halfWidth, halfHeight)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.95)
  })
  if (!blob) throw new Error("Could not encode a fixture jpeg")
  return blob
}

// Insert a one-tag little-endian EXIF APP1 segment directly after SOI.
const withJpegOrientation = (
  bytes: Uint8Array,
  orientation: number,
): Uint8Array => {
  const tiff = new Uint8Array([
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    orientation,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ])

  const payload = new Uint8Array(6 + tiff.length)
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0)
  payload.set(tiff, 6)

  const length = payload.length + 2
  const segment = new Uint8Array(4 + payload.length)
  segment[0] = 0xff
  segment[1] = 0xe1
  segment[2] = (length >> 8) & 0xff
  segment[3] = length & 0xff
  segment.set(payload, 4)

  const output = new Uint8Array(2 + segment.length + (bytes.length - 2))
  output.set(bytes.subarray(0, 2), 0)
  output.set(segment, 2)
  output.set(bytes.subarray(2), 2 + segment.length)
  return output
}

type Rgb = readonly [number, number, number]

const quadrantCenters = async (
  source: Blob,
  imageOrientation: "none" | "from-image",
): Promise<{ tl: Rgb; tr: Rgb; bl: Rgb; br: Rgb }> => {
  const bitmap = await createImageBitmap(source, { imageOrientation })
  try {
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not read fixture pixels")
    context.drawImage(bitmap, 0, 0)

    const sample = (x: number, y: number): Rgb => {
      const pixel = context.getImageData(x, y, 1, 1).data
      return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0]
    }
    const x1 = Math.floor(bitmap.width / 4)
    const x2 = Math.floor((bitmap.width * 3) / 4)
    const y1 = Math.floor(bitmap.height / 4)
    const y2 = Math.floor((bitmap.height * 3) / 4)
    return {
      tl: sample(x1, y1),
      tr: sample(x2, y1),
      bl: sample(x1, y2),
      br: sample(x2, y2),
    }
  } finally {
    bitmap.close()
  }
}

const expectRgbClose = (actual: Rgb, expected: Rgb) => {
  expect(Math.abs(actual[0] - expected[0])).toBeLessThanOrEqual(32)
  expect(Math.abs(actual[1] - expected[1])).toBeLessThanOrEqual(32)
  expect(Math.abs(actual[2] - expected[2])).toBeLessThanOrEqual(32)
}

describe("normalizeUploadedImage", () => {
  it("leaves an upright jpeg unchanged", async () => {
    // Arrange
    const bytes = new Uint8Array(
      await (await quadrantJpeg(160, 80)).arrayBuffer(),
    )
    const upright = new File([bytes], "upright.jpg", { type: "image/jpeg" })
    const taggedUpright = new File(
      [withJpegOrientation(bytes, 1)],
      "tagged.jpg",
      {
        type: "image/jpeg",
      },
    )

    // Act / Assert
    expect(await normalizeUploadedImage(upright)).toBe(upright)
    expect(await normalizeUploadedImage(taggedUpright)).toBe(taggedUpright)
  })

  it("rotates a raw bitmap when the browser does not apply EXIF itself", async () => {
    // Arrange — no orientation tag, so the bitmap is the stored pixels:
    // red | green
    // blue | white
    const bytes = new Uint8Array(
      await (await quadrantJpeg(160, 80)).arrayBuffer(),
    )
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: "image/jpeg" }),
    )

    // Act — orientation 6 is rotate 90° clockwise.
    const canvas = canvasForBitmap(bitmap, 6, true)
    bitmap.close()
    if (!canvas) throw new Error("Could not draw the oriented bitmap")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not read the oriented bitmap")
    const sample = (x: number, y: number) => {
      const pixel = context.getImageData(x, y, 1, 1).data
      return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0] as const
    }

    // Assert — blue moves to the top-left, red to the top-right.
    expect(canvas.width).toBe(80)
    expect(canvas.height).toBe(160)
    expectRgbClose(sample(20, 40), [20, 40, 210])
    expectRgbClose(sample(60, 40), [220, 20, 20])
    expectRgbClose(sample(20, 120), [245, 245, 245])
    expectRgbClose(sample(60, 120), [20, 180, 40])
  })

  it("leaves non-jpeg uploads unchanged", async () => {
    // Arrange
    const png = new File([new Uint8Array([1, 2, 3])], "icon.png", {
      type: "image/png",
    })

    // Act / Assert
    expect(await normalizeUploadedImage(png)).toBe(png)
  })

  it.each([2, 3, 4, 5, 6, 7, 8])(
    "bakes EXIF orientation %s into the pixels and drops the tag",
    async (orientation) => {
      // Arrange — quadrants are asymmetric, so a flip is not a rotation.
      const bytes = new Uint8Array(
        await (await quadrantJpeg(160, 80)).arrayBuffer(),
      )
      const tagged = withJpegOrientation(bytes, orientation)
      const file = new File([tagged], "portrait.jpg", { type: "image/jpeg" })

      // Act
      const normalized = await normalizeUploadedImage(file)

      // Assert — a viewer that ignores EXIF (WebP derivatives, CSS backgrounds)
      // shows the same picture as a viewer that honors it (the uploader's computer).
      // Honoring EXIF on the result must not rotate the photo a second time.
      expect(normalized).not.toBe(file)
      const outputOrientation = await exifr.orientation(normalized)
      expect(outputOrientation === undefined || outputOrientation === 1).toBe(
        true,
      )

      const expected = await quadrantCenters(file, "from-image")
      const baked = await quadrantCenters(normalized, "none")
      const honoredAgain = await quadrantCenters(normalized, "from-image")
      expectRgbClose(baked.tl, expected.tl)
      expectRgbClose(baked.tr, expected.tr)
      expectRgbClose(baked.bl, expected.bl)
      expectRgbClose(baked.br, expected.br)
      expectRgbClose(honoredAgain.tl, baked.tl)
      expectRgbClose(honoredAgain.tr, baked.tr)
      expectRgbClose(honoredAgain.bl, baked.bl)
      expectRgbClose(honoredAgain.br, baked.br)
    },
  )
})
