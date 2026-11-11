/**
 * Image baking utility for client-side crop operations.
 *
 * FAIL-SAFE SAVE ORDER (save wiring is a later task):
 * 1. Upload baked image Blob to S3 first
 * 2. Only on S3 success: atomically update the database with new src + imageAdjustment
 * 3. Any earlier failure leaves the original blob untouched
 *
 * This utility only produces the Blob; the atomic save is the caller's responsibility.
 */

import type { ImageAdjustment } from "@opengovsg/isomer-components"

export type CropRect = Pick<
  ImageAdjustment["crop"],
  "x" | "y" | "width" | "height"
>

export interface PixelRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

// Static raster formats a browser canvas can reliably re-encode. Single source
// of truth for both the client gate (canBakeImage) and the server presign
// schema's `ext`. Deliberately distinct from CONTENT_TYPE_TO_FORMAT (the infra
// optimizer): avif/tiff are excluded because canvas.toBlob support is
// unreliable. Animated WebP/APNG share a MIME with their static form, so they
// pass this gate and are caught separately by isAnimatedImageBlob.
export const BAKEABLE_FORMAT_BY_MIME = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type BakeableExtension =
  (typeof BAKEABLE_FORMAT_BY_MIME)[keyof typeof BAKEABLE_FORMAT_BY_MIME]

export const BAKEABLE_EXTENSIONS = Object.values(BAKEABLE_FORMAT_BY_MIME) as [
  BakeableExtension,
  ...BakeableExtension[],
]

/**
 * Whether an image MIME type can be baked (see BAKEABLE_FORMAT_BY_MIME).
 * @param mimeType - The MIME type string (e.g., "image/jpeg")
 */
export const canBakeImage = (mimeType: string): boolean =>
  Object.hasOwn(BAKEABLE_FORMAT_BY_MIME, mimeType)

// --- Animation sniffing -----------------------------------------------------
// Animated WebP and APNG share image/webp and image/png with their static
// counterparts, so canBakeImage passes them. Baking rasterizes a single frame
// and silently drops the animation, so we sniff the container bytes and reject.

const matchesAscii = (
  bytes: Uint8Array,
  offset: number,
  ascii: string,
): boolean => {
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false
  }
  return true
}

const readUint32BE = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
  )

/**
 * Detect animated WebP via the VP8X extended-format animation flag.
 * Layout: "RIFF"(0) size(4) "WEBP"(8) "VP8X"(12) size(16) flags(20),
 * where flags bit 1 (0x02) marks animation. Non-extended WebP (VP8/VP8L)
 * can't be animated.
 */
export const isAnimatedWebp = (bytes: Uint8Array): boolean => {
  if (bytes.length < 21) return false
  if (!matchesAscii(bytes, 0, "RIFF") || !matchesAscii(bytes, 8, "WEBP")) {
    return false
  }
  if (!matchesAscii(bytes, 12, "VP8X")) return false
  return ((bytes[20] ?? 0) & 0x02) !== 0
}

/**
 * Detect APNG via the "acTL" animation-control chunk, which a valid APNG
 * places before the first "IDAT". Walks the PNG chunk list until either.
 */
export const isAnimatedPng = (bytes: Uint8Array): boolean => {
  const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < SIGNATURE.length) return false
  if (SIGNATURE.some((b, i) => bytes[i] !== b)) return false

  // Each chunk: 4-byte length, 4-byte type, length data bytes, 4-byte CRC.
  let offset = SIGNATURE.length
  while (offset + 8 <= bytes.length) {
    if (matchesAscii(bytes, offset + 4, "acTL")) return true
    if (matchesAscii(bytes, offset + 4, "IDAT")) return false
    offset += 12 + readUint32BE(bytes, offset)
  }
  return false
}

/**
 * Whether a blob is an animated image that baking would flatten. Only WebP
 * and PNG need sniffing (JPEG, the other bakeable MIME, can't animate) --
 * checked against the MIME first so a JPEG never pays for reading its full
 * byte contents just to be told it isn't a container format at all.
 */
export const isAnimatedImageBlob = async (blob: Blob): Promise<boolean> => {
  if (blob.type !== "image/webp" && blob.type !== "image/png") return false
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return blob.type === "image/webp"
    ? isAnimatedWebp(bytes)
    : isAnimatedPng(bytes)
}

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(Math.max(n, lo), hi)

// Rounds a normalized [start, start+size) span to a pixel-space [start, end)
// span that's guaranteed to stay within [0, srcSize] and -- for any positive
// size -- to cover at least 1px. Rounding the START and END coordinates
// (not start+size independently) means start+size can never exceed srcSize
// from rounding drift alone (e.g. a 0.5/0.5 split of a 3px source
// independently rounds to start=2, size=2, overflowing by 1); clamping on
// top of that also catches a genuinely tiny positive size (e.g. 5% of a
// 10px source) that would otherwise round away to a zero-pixel span the
// canvas can't draw.
const roundPixelSpan = (
  startFrac: number,
  sizeFrac: number,
  srcSize: number,
): { start: number; size: number } => {
  if (sizeFrac <= 0) {
    return {
      start: clamp(Math.round(startFrac * srcSize), 0, srcSize),
      size: 0,
    }
  }
  const start = clamp(Math.round(startFrac * srcSize), 0, srcSize - 1)
  const end = clamp(
    Math.round((startFrac + sizeFrac) * srcSize),
    start + 1,
    srcSize,
  )
  return { start, size: end - start }
}

/**
 * Convert a normalized crop rectangle to pixel coordinates.
 * Assumes the input image has already been orientation-normalized via
 * createImageBitmap({ imageOrientation: "from-image" }).
 *
 * @param crop - Normalized crop rect with x, y, width, height in [0,1]
 * @param srcWidth - Pixel width of the orientation-normalized source
 * @param srcHeight - Pixel height of the orientation-normalized source
 * @returns Pixel-space source rectangle: {sx, sy, sw, sh}
 */
export const cropRectToPixels = (
  crop: CropRect,
  srcWidth: number,
  srcHeight: number,
): PixelRect => {
  const { start: sx, size: sw } = roundPixelSpan(crop.x, crop.width, srcWidth)
  const { start: sy, size: sh } = roundPixelSpan(crop.y, crop.height, srcHeight)
  return { sx, sy, sw, sh }
}

export interface BakeImageOptions {
  mimeType: string
  quality?: number
}

// Guards the OffscreenCanvas symbol: `canvas instanceof OffscreenCanvas` throws
// ReferenceError in browsers that lack it. As a type predicate it also narrows
// the HTMLCanvasElement branch, so neither convertToBlob branch needs a cast.
const isOffscreenCanvas = (
  canvas: OffscreenCanvas | HTMLCanvasElement,
): canvas is OffscreenCanvas =>
  typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas

const canvasToBlob = (
  canvas: OffscreenCanvas | HTMLCanvasElement,
  opts: BakeImageOptions,
): Promise<Blob> => {
  if (isOffscreenCanvas(canvas)) {
    return canvas.convertToBlob({ type: opts.mimeType, quality: opts.quality })
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas toBlob returned null"))
        else resolve(blob)
      },
      opts.mimeType,
      opts.quality,
    )
  })
}

/**
 * Bake an image by applying crop from an adjustment object. The original blob
 * is decoded with EXIF orientation normalization, ensuring crop coordinates
 * are interpreted against an upright reference frame. Re-encoding always
 * starts from the original (never a prior bake).
 *
 * @param original - The original image Blob (never a prior bake)
 * @param adjustment - Adjustment object with crop
 * @param opts - Bake options: mimeType (required), quality (0-1, optional)
 * @returns Promise<Blob> - The baked image Blob
 * @throws Error if the mimeType is not bakeable
 */
export const bakeImage = async (
  original: Blob,
  adjustment: Pick<ImageAdjustment, "crop">,
  opts: BakeImageOptions,
): Promise<Blob> => {
  // Guard: only static raster formats
  if (!canBakeImage(opts.mimeType)) {
    throw new Error(
      `Cannot bake image format "${opts.mimeType}". Supported formats: JPEG, PNG, WebP.`,
    )
  }

  // Guard against baking an animated source: canvas rasterizes a single
  // frame, silently dropping the animation. This is also checked by
  // bakeImage's current callers before invoking it, but enforcing it here
  // too means any future caller gets the same protection for free.
  if (await isAnimatedImageBlob(original)) {
    throw new Error(
      "Cannot bake an animated image: baking would flatten it to a single frame.",
    )
  }

  // Decode with EXIF orientation normalization (upright reference frame)
  const bitmap = await createImageBitmap(original, {
    imageOrientation: "from-image",
  })

  try {
    const { sx, sy, sw, sh } = cropRectToPixels(
      adjustment.crop,
      bitmap.width,
      bitmap.height,
    )

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(sw, sh)
        : document.createElement("canvas")

    if ("width" in canvas) canvas.width = sw
    if ("height" in canvas) canvas.height = sh

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2D canvas context")
    }

    // Draw the cropped region onto the canvas
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)

    const blob = await canvasToBlob(canvas, opts)
    // Some browsers can decode a format they can't encode via canvas and
    // silently substitute PNG instead (e.g. requesting webp) -- verify the
    // actual output type rather than trusting the request succeeded.
    if (blob.type !== opts.mimeType) {
      throw new Error(
        `Failed to encode image as "${opts.mimeType}" (the browser produced "${blob.type || "an unknown type"}" instead).`,
      )
    }
    return blob
  } finally {
    bitmap.close()
  }
}
