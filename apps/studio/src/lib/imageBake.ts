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

/**
 * Determines whether an image MIME type can be baked.
 * Allows static raster formats only: JPEG, PNG, and WebP.
 * Blocks SVG and GIF. Animated WebP/APNG cannot be detected from MIME alone;
 * TODO: implement byte-sniffing for animated-format detection (follow-up).
 *
 * @param mimeType - The MIME type string (e.g., "image/jpeg")
 * @returns true if the format is bakeable; false otherwise
 */
export const canBakeImage = (mimeType: string): boolean => {
  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  )
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
  return {
    sx: Math.round(crop.x * srcWidth),
    sy: Math.round(crop.y * srcHeight),
    sw: Math.round(crop.width * srcWidth),
    sh: Math.round(crop.height * srcHeight),
  }
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

  // Decode with EXIF orientation normalization (upright reference frame)
  const bitmap = await createImageBitmap(original, {
    imageOrientation: "from-image",
  })

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

  // Convert to blob with the specified MIME type and quality
  const convertToBlob =
    canvas instanceof OffscreenCanvas
      ? () =>
          canvas.convertToBlob({ type: opts.mimeType, quality: opts.quality })
      : () =>
          new Promise<Blob>((resolve, reject) => {
            const htmlCanvas = canvas as HTMLCanvasElement
            htmlCanvas.toBlob(
              (blob) => {
                if (!blob) reject(new Error("Canvas toBlob returned null"))
                else resolve(blob)
              },
              opts.mimeType,
              opts.quality,
            )
          })

  return convertToBlob()
}
