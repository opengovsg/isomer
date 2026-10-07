import exifr from "exifr"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"

const JPEG_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/pjpeg"])

const isJpeg = (file: File, fileName: string): boolean => {
  if (JPEG_MIME_TYPES.has(file.type.toLowerCase())) return true
  const lowerName = fileName.toLowerCase()
  return lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
}

// Browsers older than the versions exifr tracks do not autorotate canvas
// pixels. Apply the EXIF orientation to the raw bitmap. `width` and `height`
// are the bitmap's stored dimensions, before the correction.
const orientRawBitmap = (
  context: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
) => {
  switch (orientation) {
    case 2:
      context.translate(width, 0)
      context.scale(-1, 1)
      break
    case 3:
      context.translate(width, height)
      context.rotate(Math.PI)
      break
    case 4:
      context.translate(0, height)
      context.scale(1, -1)
      break
    case 5:
      context.rotate(0.5 * Math.PI)
      context.scale(1, -1)
      break
    case 6:
      context.rotate(0.5 * Math.PI)
      context.translate(0, -height)
      break
    case 7:
      context.rotate(0.5 * Math.PI)
      context.translate(width, -height)
      context.scale(-1, 1)
      break
    case 8:
      context.rotate(-0.5 * Math.PI)
      context.translate(-width, 0)
      break
    default:
      break
  }
}

export const canvasForBitmap = (
  bitmap: ImageBitmap,
  orientation: number,
  applyOrientation: boolean,
): HTMLCanvasElement | null => {
  const swapsAxes = applyOrientation && orientation >= 5 && orientation <= 8
  const canvas = document.createElement("canvas")
  canvas.width = swapsAxes ? bitmap.height : bitmap.width
  canvas.height = swapsAxes ? bitmap.width : bitmap.height
  const context = canvas.getContext("2d")
  if (!context) return null

  if (applyOrientation) {
    orientRawBitmap(context, orientation, bitmap.width, bitmap.height)
  }
  context.drawImage(bitmap, 0, 0)
  return canvas
}

const encodeJpeg = (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
  })

const encodeWithinSizeLimit = async (
  canvas: HTMLCanvasElement,
): Promise<Blob | null> => {
  for (const quality of [0.92, 0.8]) {
    const blob = await encodeJpeg(canvas, quality)
    if (blob && blob.size > 0 && blob.size <= MAX_IMG_FILE_SIZE_BYTES)
      return blob
  }
  return null
}

/**
 * Phone cameras store sensor pixels sideways (or mirrored) and record the
 * correction in an EXIF Orientation tag. macOS and JPEG `<img>` apply that
 * tag, but the live site's WebP/AVIF derivatives do not, so the published
 * photo looks rotated or flipped.
 *
 * When the tag is not upright, rewrite the JPEG so the pixels themselves are
 * upright and the tag is gone. Upright files are returned unchanged.
 * `exifr.rotateCanvas` is false once the browser already applies the tag
 * while decoding; applying it again would rotate the photo twice.
 */
export const normalizeUploadedImage = async (
  file: File,
  fileName = file.name,
): Promise<File> => {
  if (!isJpeg(file, fileName)) return file
  if (
    typeof createImageBitmap !== "function" ||
    typeof document === "undefined"
  ) {
    return file
  }

  let bitmap: ImageBitmap | undefined
  try {
    const orientation = await exifr.orientation(file)
    if (orientation === undefined || orientation === 1) return file
    if (exifr.rotations[orientation] === undefined) return file

    bitmap = await createImageBitmap(file)
    const canvas = canvasForBitmap(bitmap, orientation, exifr.rotateCanvas)
    if (!canvas) return file

    const blob = await encodeWithinSizeLimit(canvas)
    if (!blob) return file

    return new File([blob], fileName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
