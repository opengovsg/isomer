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

  it("leaves png, avif, and other uploads unchanged", async () => {
    // Arrange
    const png = new File([new Uint8Array([1, 2, 3])], "icon.png", {
      type: "image/png",
    })
    const avif = new File([new Uint8Array([1, 2, 3])], "still.avif", {
      type: "image/avif",
    })

    // Act / Assert
    expect(await normalizeUploadedImage(png)).toBe(png)
    expect(await normalizeUploadedImage(avif)).toBe(avif)
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

const encodeQuadrant = async (
  width: number,
  height: number,
  type: string,
  paint?: (context: CanvasRenderingContext2D) => void,
): Promise<Uint8Array> => {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not draw a fixture image")
  if (paint) {
    paint(context)
  } else {
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
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), type, 0.95)
  })
  if (!blob || blob.type !== type) throw new Error(`Could not encode ${type}`)
  return new Uint8Array(await blob.arrayBuffer())
}

const tiffOrientation = (orientation: number): Uint8Array =>
  new Uint8Array([
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

const text4 = (bytes: Uint8Array, offset: number) =>
  String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  )

const withWebpOrientation = (
  bytes: Uint8Array,
  orientation: number,
): Uint8Array => {
  const chunks: { kind: string; payload: Uint8Array }[] = []
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const kind = text4(bytes, offset)
    const size = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(offset + 4, true)
    chunks.push({
      kind,
      payload: bytes.slice(offset + 8, offset + 8 + size),
    })
    offset += 8 + size + (size & 1)
  }

  const exif = tiffOrientation(orientation)
  const extended = chunks.findIndex((chunk) => chunk.kind === "VP8X")
  if (extended >= 0) {
    const payload = new Uint8Array(chunks[extended]?.payload ?? [])
    payload[0] = (payload[0] ?? 0) | 0x08
    chunks[extended] = { kind: "VP8X", payload }
    const kept = chunks.filter((chunk) => chunk.kind !== "EXIF")
    kept.push({ kind: "EXIF", payload: exif })
    return assembleWebp(kept)
  }

  const image = chunks.find(
    (chunk) => chunk.kind === "VP8 " || chunk.kind === "VP8L",
  )
  if (!image) throw new Error("Fixture WebP has no image chunk")
  const start = image.payload.indexOf(0x9d)
  const width =
    (image.payload[start + 3] ?? 0) |
    (((image.payload[start + 4] ?? 0) & 0x3f) << 8)
  const height =
    (image.payload[start + 5] ?? 0) |
    (((image.payload[start + 6] ?? 0) & 0x3f) << 8)
  const vp8x = new Uint8Array(10)
  vp8x[0] = 0x08
  vp8x[4] = (width - 1) & 0xff
  vp8x[5] = ((width - 1) >> 8) & 0xff
  vp8x[6] = ((width - 1) >> 16) & 0xff
  vp8x[7] = (height - 1) & 0xff
  vp8x[8] = ((height - 1) >> 8) & 0xff
  vp8x[9] = ((height - 1) >> 16) & 0xff
  return assembleWebp([
    { kind: "VP8X", payload: vp8x },
    image,
    { kind: "EXIF", payload: exif },
  ])
}

const assembleWebp = (
  chunks: { kind: string; payload: Uint8Array }[],
): Uint8Array => {
  const parts = chunks.map((chunk) => {
    const padded = chunk.payload.length + (chunk.payload.length & 1)
    const out = new Uint8Array(8 + padded)
    out.set(new TextEncoder().encode(chunk.kind), 0)
    new DataView(out.buffer).setUint32(4, chunk.payload.length, true)
    out.set(chunk.payload, 8)
    return out
  })
  const bodyLength = parts.reduce((sum, part) => sum + part.length, 0)
  const file = new Uint8Array(12 + bodyLength)
  file.set(new TextEncoder().encode("RIFF"), 0)
  new DataView(file.buffer).setUint32(4, 4 + bodyLength, true)
  file.set(new TextEncoder().encode("WEBP"), 8)
  let cursor = 12
  for (const part of parts) {
    file.set(part, cursor)
    cursor += part.length
  }
  return file
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Could not read the expected bitmap"))
    })
  })

describe("normalizeUploadedImage webp", () => {
  it("leaves an upright webp and an animated webp unchanged", async () => {
    // Arrange
    const bytes = await encodeQuadrant(160, 80, "image/webp")
    const upright = new File([bytes], "upright.webp", { type: "image/webp" })
    const taggedUpright = new File(
      [withWebpOrientation(bytes, 1)],
      "tagged.webp",
      { type: "image/webp" },
    )
    const tagged = withWebpOrientation(bytes, 6)
    const anim = new Uint8Array(14)
    anim.set(new TextEncoder().encode("ANIM"), 0)
    new DataView(anim.buffer).setUint32(4, 6, true)
    const animatedBytes = new Uint8Array(tagged.length + anim.length)
    animatedBytes.set(tagged, 0)
    animatedBytes.set(anim, tagged.length)
    const animated = new File([animatedBytes], "clip.webp", {
      type: "image/webp",
    })

    // Act / Assert
    expect(await normalizeUploadedImage(upright)).toBe(upright)
    expect(await normalizeUploadedImage(taggedUpright)).toBe(taggedUpright)
    expect(await normalizeUploadedImage(animated)).toBe(animated)
  })

  it.each([2, 3, 4, 5, 6, 7, 8])(
    "bakes WebP EXIF orientation %s without changing the format",
    async (orientation) => {
      // Arrange
      const bytes = await encodeQuadrant(160, 80, "image/webp")
      const file = new File(
        [withWebpOrientation(bytes, orientation)],
        "photo.webp",
        {
          type: "image/webp",
        },
      )
      const raw = await createImageBitmap(
        new Blob([bytes], { type: "image/webp" }),
      )
      const expectedCanvas = canvasForBitmap(raw, orientation, true)
      raw.close()
      if (!expectedCanvas) throw new Error("Could not draw the expected bitmap")

      // Act
      const normalized = await normalizeUploadedImage(file)

      // Assert
      expect(normalized).not.toBe(file)
      expect(normalized.type).toBe("image/webp")
      expect(normalized.name).toBe("photo.webp")
      const outputOrientation = await exifr
        .orientation(normalized)
        .catch(() => undefined)
      expect(outputOrientation === undefined || outputOrientation === 1).toBe(
        true,
      )
      const expected = await quadrantCenters(
        await canvasToBlob(expectedCanvas),
        "none",
      )
      const baked = await quadrantCenters(normalized, "none")
      expectRgbClose(baked.tl, expected.tl)
      expectRgbClose(baked.tr, expected.tr)
      expectRgbClose(baked.bl, expected.bl)
      expectRgbClose(baked.br, expected.br)
    },
  )

  it("keeps WebP transparency while baking orientation", async () => {
    // Arrange — left half is transparent, so a horizontal mirror moves it to the right.
    const bytes = await encodeQuadrant(160, 80, "image/webp", (context) => {
      context.clearRect(0, 0, 160, 80)
      context.fillStyle = "rgba(220, 20, 20, 0)"
      context.fillRect(0, 0, 80, 80)
      context.fillStyle = "rgb(20, 180, 40)"
      context.fillRect(80, 0, 80, 80)
    })
    const file = new File([withWebpOrientation(bytes, 2)], "mark.webp", {
      type: "image/webp",
    })

    // Act
    const normalized = await normalizeUploadedImage(file)

    // Assert
    expect(normalized.type).toBe("image/webp")
    const bitmap = await createImageBitmap(normalized, {
      imageOrientation: "none",
    })
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not read the rewritten webp")
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const left = context.getImageData(20, 40, 1, 1).data
    const right = context.getImageData(120, 40, 1, 1).data
    expect(left[1]).toBeGreaterThan(100)
    expect(left[3]).toBe(255)
    expect(right[3]).toBeLessThanOrEqual(16)
  })
})
