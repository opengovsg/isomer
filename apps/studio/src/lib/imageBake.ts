/**
 * Image baking utility for client-side crop, rotate, and flip operations.
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
  (bytes[offset] ?? 0) * 0x1000000 +
  (((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0))

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
 * Whether the given bytes are an animated image that baking would flatten.
 * Only WebP and PNG need sniffing; JPEG (the other bakeable MIME) can't animate.
 */
export const isAnimatedImageBytes = (
  mimeType: string,
  bytes: Uint8Array,
): boolean => {
  if (mimeType === "image/webp") return isAnimatedWebp(bytes)
  if (mimeType === "image/png") return isAnimatedPng(bytes)
  return false
}

/** Blob wrapper around isAnimatedImageBytes. */
export const isAnimatedImageBlob = async (blob: Blob): Promise<boolean> =>
  isAnimatedImageBytes(blob.type, new Uint8Array(await blob.arrayBuffer()))

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
  // Round the START and END coordinates (not start+size independently), so
  // sx+sw can never exceed srcWidth due to rounding drift -- e.g. a 0.5/0.5
  // split of a 3px-wide source independently rounds to sx=2, sw=2 (overflow);
  // rounding the end coordinate instead gives sx=2, sw=round(3)-2=1.
  const sx = Math.round(crop.x * srcWidth)
  const sy = Math.round(crop.y * srcHeight)
  const sw = Math.round((crop.x + crop.width) * srcWidth) - sx
  const sh = Math.round((crop.y + crop.height) * srcHeight) - sy
  return { sx, sy, sw, sh }
}

/**
 * Calculate output canvas dimensions after rotation.
 * Rotations of 90 or 270 degrees swap width and height.
 * Rotations of 0 or 180 degrees preserve the dimensions.
 *
 * @param croppedWidth - Pixel width of the cropped region
 * @param croppedHeight - Pixel height of the cropped region
 * @param rotate - Rotation in degrees: 0, 90, 180, or 270
 * @returns Object with output {width, height}
 */
export const outputDimensions = (
  croppedWidth: number,
  croppedHeight: number,
  rotate: 0 | 90 | 180 | 270,
): { width: number; height: number } => {
  if (rotate === 90 || rotate === 270) {
    return { width: croppedHeight, height: croppedWidth }
  }
  return { width: croppedWidth, height: croppedHeight }
}

/**
 * Compute canvas transform scale factors (rotate, flipH, flipV).
 * Returns the transformation parameters to be applied to the canvas.
 *
 * @param rotate - Rotation in degrees: 0, 90, 180, or 270
 * @param flipH - Whether to flip horizontally
 * @param flipV - Whether to flip vertically
 * @returns Object with {rotate, scaleX, scaleY}
 */
export const computeCanvasTransform = (
  rotate: 0 | 90 | 180 | 270,
  flipH: boolean,
  flipV: boolean,
): {
  rotate: number
  scaleX: number
  scaleY: number
} => {
  // Build scale factors: -1 for flip, 1 for no flip
  const scaleX = flipH ? -1 : 1
  const scaleY = flipV ? -1 : 1

  return { rotate, scaleX, scaleY }
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

/**
 * Bake an image by applying crop, rotate, and flip from an adjustment object.
 * The original blob is decoded with EXIF orientation normalization, ensuring
 * crop coordinates are interpreted against an upright reference frame.
 * Re-encoding always starts from the original (never a prior bake).
 *
 * @param original - The original image Blob (never a prior bake)
 * @param adjustment - Adjustment object with crop, rotate, flipH, flipV
 * @param opts - Bake options: mimeType (required), quality (0-1, optional)
 * @returns Promise<Blob> - The baked image Blob
 * @throws Error if the mimeType is not bakeable
 */
export const bakeImage = async (
  original: Blob,
  adjustment: Pick<ImageAdjustment, "crop" | "rotate" | "flipH" | "flipV">,
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

    const { width: outputWidth, height: outputHeight } = outputDimensions(
      sw,
      sh,
      adjustment.rotate,
    )

    // Create canvas and apply transforms
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(outputWidth, outputHeight)
        : document.createElement("canvas")

    if ("width" in canvas) canvas.width = outputWidth
    if ("height" in canvas) canvas.height = outputHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2D canvas context")
    }

    // Apply rotate + flip transforms
    const { rotate, scaleX, scaleY } = computeCanvasTransform(
      adjustment.rotate,
      adjustment.flipH,
      adjustment.flipV,
    )

    // Translate to center, apply transforms, translate back
    ctx.translate(outputWidth / 2, outputHeight / 2)
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY)
    }
    if (rotate !== 0) {
      ctx.rotate((rotate * Math.PI) / 180)
    }
    ctx.translate(-sw / 2, -sh / 2)

    // Draw the cropped region onto the canvas
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)

    // Convert to blob with the specified MIME type and quality.
    // Guard the OffscreenCanvas symbol via a type predicate: referencing it
    // directly in `instanceof` throws ReferenceError in browsers that lack it,
    // and the predicate still narrows the HTMLCanvasElement branch (no cast).
    const convertToBlob = isOffscreenCanvas(canvas)
      ? () =>
          canvas.convertToBlob({ type: opts.mimeType, quality: opts.quality })
      : () =>
          new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) reject(new Error("Canvas toBlob returned null"))
                else resolve(blob)
              },
              opts.mimeType,
              opts.quality,
            )
          })

    const blob = await convertToBlob()
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
