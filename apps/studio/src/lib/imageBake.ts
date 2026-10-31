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

// Inverse of BAKEABLE_FORMAT_BY_MIME (plus the ".jpg" alias) for deriving a
// trusted MIME from a server-validated key extension when the fetched blob's
// HTTP Content-Type is missing or generic (e.g. a CDN serving
// "binary/octet-stream").
const BAKEABLE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

/**
 * Derive a bakeable MIME from a key/filename extension, or undefined if the
 * extension isn't a bakeable image format.
 * @param key - An asset key or filename (e.g. "1/uuid/photo.png")
 */
export const mimeFromKeyExtension = (key: string): string | undefined => {
  const ext = key.split(".").pop()?.toLowerCase()
  return ext ? BAKEABLE_MIME_BY_EXTENSION[ext] : undefined
}

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

// Skip a GIF data-sub-block chain (each block: a 1-byte length then that many
// bytes; a zero-length block terminates). Returns the offset past the terminator.
const skipGifSubBlocks = (bytes: Uint8Array, offset: number): number => {
  while (offset < bytes.length) {
    const size = bytes[offset] ?? 0
    offset += 1
    if (size === 0) break
    offset += size
  }
  return offset
}

/**
 * Detect an animated GIF — one carrying more than one image frame. Needed
 * because a GIF can arrive under a .webp/.png name (wrong extension), passing
 * the bakeable-format gate; baking would then flatten the animation. Walks the
 * block stream counting Image Separators (0x2C) and bails safely on malformed
 * structure (treated as not-animated — the save-time guard remains a backstop).
 */
export const isAnimatedGif = (bytes: Uint8Array): boolean => {
  if (bytes.length < 13) return false
  if (!matchesAscii(bytes, 0, "GIF87a") && !matchesAscii(bytes, 0, "GIF89a")) {
    return false
  }
  // 6-byte header + 7-byte logical screen descriptor; skip the global color
  // table when its flag (bit 7 of the packed byte at offset 10) is set.
  let offset = 13
  const packed = bytes[10] ?? 0
  if (packed & 0x80) offset += 3 * (2 << (packed & 0x07))

  let frames = 0
  while (offset < bytes.length) {
    const block = bytes[offset]
    if (block === 0x3b) break // trailer
    if (block === 0x2c) {
      if (++frames > 1) return true
      const imgPacked = bytes[offset + 9] ?? 0
      offset += 10 // image descriptor
      if (imgPacked & 0x80) offset += 3 * (2 << (imgPacked & 0x07)) // local table
      offset += 1 // LZW minimum code size
      offset = skipGifSubBlocks(bytes, offset)
    } else if (block === 0x21) {
      offset += 2 // extension introducer + label
      offset = skipGifSubBlocks(bytes, offset)
    } else {
      break // unknown block — bail safely
    }
  }
  return false
}

/**
 * Whether the given bytes are an animated image that baking would flatten.
 * Sniffs by magic bytes, NOT the declared MIME: a Blob's `type` is often empty
 * or a generic "binary/octet-stream" (uploaded File with no type, a ?original
 * fetch), and a file can even carry the wrong extension (an animated GIF named
 * .webp), either of which would make a MIME switch miss it. Each sniffer
 * self-guards on its container signature, so OR-ing them is safe — only
 * an actual animated WebP/APNG/GIF returns true; JPEG and every static image don't.
 */
export const isAnimatedImageBytes = (bytes: Uint8Array): boolean =>
  isAnimatedWebp(bytes) || isAnimatedPng(bytes) || isAnimatedGif(bytes)

/** Blob wrapper around isAnimatedImageBytes. */
export const isAnimatedImageBlob = async (blob: Blob): Promise<boolean> =>
  isAnimatedImageBytes(new Uint8Array(await blob.arrayBuffer()))

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
    // The editor crops against the rotated/flipped ("display") image, so crop
    // coordinates are normalized to THAT, not the original — rotate/flip
    // first, then crop. Flipping doesn't change dimensions; a 90/270
    // rotation swaps them.
    const rotatedQuarter = adjustment.rotate === 90 || adjustment.rotate === 270
    const displayWidth = rotatedQuarter ? bitmap.height : bitmap.width
    const displayHeight = rotatedQuarter ? bitmap.width : bitmap.height

    // Crop rect in display-image pixels. Its size is the output size
    // directly — the rotation has already been accounted for by swapping
    // the display dims.
    const {
      sx: dx,
      sy: dy,
      sw: outputWidth,
      sh: outputHeight,
    } = cropRectToPixels(adjustment.crop, displayWidth, displayHeight)

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

    // Draw the WHOLE original into the cropped display frame: shift so the
    // crop's top-left sits at the canvas origin, move to the display centre,
    // flip, rotate, then centre the original before drawing it.
    ctx.translate(displayWidth / 2 - dx, displayHeight / 2 - dy)
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY)
    }
    if (rotate !== 0) {
      ctx.rotate((rotate * Math.PI) / 180)
    }
    ctx.translate(-bitmap.width / 2, -bitmap.height / 2)

    // Draw the full original; the canvas size + translate above crop it.
    ctx.drawImage(bitmap, 0, 0)

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

// Quality steps tried, in order, when the full-quality bake exceeds maxBytes.
// Only applies to lossy formats (JPEG/WebP) -- PNG has no quality knob, so a
// source that's already near the limit can still produce an oversize PNG
// bake; bakeImageWithinSizeLimit returns its best (still-oversize) attempt in
// that case and leaves surfacing the error to the caller.
const QUALITY_BACKOFF_STEPS = [0.8, 0.6, 0.4]

/**
 * Bakes an image, retrying at progressively lower quality if the full-quality
 * encode exceeds `maxBytes`. A crop/re-encode through canvas can end up
 * LARGER than a well-optimized source JPEG even at the browser's default
 * quality (canvas re-encoding loses the original encoder's specific
 * optimization), so a source that passed the upload-time size check can still
 * fail the save-time bake check with no warning at upload — this back-off
 * closes most of that gap before it ever reaches the server.
 * @param maxBytes - The server's size cap for the baked output
 * @returns The smallest successful bake, or the smallest attempt tried if
 * none got under maxBytes (e.g. PNG, which has no quality knob, or still
 * oversize even at the lowest quality step) -- the caller is responsible for
 * checking the result's size and surfacing a clear error if it's still too
 * large.
 */
export const bakeImageWithinSizeLimit = async (
  original: Blob,
  adjustment: Pick<ImageAdjustment, "crop" | "rotate" | "flipH" | "flipV">,
  opts: { mimeType: string; maxBytes: number },
): Promise<Blob> => {
  const fullQuality = await bakeImage(original, adjustment, {
    mimeType: opts.mimeType,
  })
  if (fullQuality.size <= opts.maxBytes) return fullQuality

  const isLossy =
    opts.mimeType === "image/jpeg" || opts.mimeType === "image/webp"
  if (!isLossy) return fullQuality

  let smallest = fullQuality
  for (const quality of QUALITY_BACKOFF_STEPS) {
    const attempt = await bakeImage(original, adjustment, {
      mimeType: opts.mimeType,
      quality,
    })
    if (attempt.size <= opts.maxBytes) return attempt
    if (attempt.size < smallest.size) smallest = attempt
  }
  return smallest
}
