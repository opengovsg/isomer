import exifr from "exifr"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"

const JPEG_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/pjpeg"])

const isJpeg = (file: File, fileName: string): boolean => {
  if (JPEG_MIME_TYPES.has(file.type.toLowerCase())) return true
  const lowerName = fileName.toLowerCase()
  return lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
}

const isWebp = (file: File, fileName: string): boolean =>
  file.type.toLowerCase() === "image/webp" ||
  fileName.toLowerCase().endsWith(".webp")

const fourcc = (bytes: Uint8Array, offset: number): string | null => {
  if (offset < 0 || offset + 4 > bytes.length) return null
  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  )
}

const readU32 = (bytes: Uint8Array, offset: number, littleEndian: boolean) => {
  if (offset < 0 || offset + 4 > bytes.length) return null
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(offset, littleEndian)
}

interface RiffChunk {
  kind: string
  payload: Uint8Array
}

// exifr cannot open a WebP container. The EXIF chunk inside it is a TIFF
// block, which exifr can read.
const readWebpChunks = (bytes: Uint8Array): RiffChunk[] | null => {
  if (fourcc(bytes, 0) !== "RIFF" || fourcc(bytes, 8) !== "WEBP") return null
  const chunks: RiffChunk[] = []
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const kind = fourcc(bytes, offset)
    const size = readU32(bytes, offset + 4, true)
    if (!kind || size === null || offset + 8 + size > bytes.length) return null
    chunks.push({
      kind,
      payload: bytes.subarray(offset + 8, offset + 8 + size),
    })
    offset += 8 + size + (size & 1)
  }
  return chunks
}

const isAnimatedWebp = (bytes: Uint8Array): boolean => {
  const chunks = readWebpChunks(bytes)
  if (!chunks) return false
  return chunks.some((chunk) => {
    if (chunk.kind === "ANIM" || chunk.kind === "ANMF") return true
    // VP8X flag bit 1 marks an animation. Leave those files as uploaded.
    return chunk.kind === "VP8X" && ((chunk.payload[0] ?? 0) & 0x02) !== 0
  })
}

const webpStoredSize = (
  bytes: Uint8Array,
): { width: number; height: number } | null => {
  const extended = readWebpChunks(bytes)?.find((chunk) => chunk.kind === "VP8X")
  if (!extended || extended.payload.length < 10) return null
  const payload = extended.payload
  return {
    width:
      1 +
      (payload[4] ?? 0) +
      ((payload[5] ?? 0) << 8) +
      ((payload[6] ?? 0) << 16),
    height:
      1 +
      (payload[7] ?? 0) +
      ((payload[8] ?? 0) << 8) +
      ((payload[9] ?? 0) << 16),
  }
}

const readWebpOrientation = async (
  bytes: Uint8Array,
): Promise<number | undefined> => {
  const payload = readWebpChunks(bytes)?.find(
    (chunk) => chunk.kind === "EXIF",
  )?.payload
  if (!payload) return undefined
  const candidates = [payload]
  if (
    payload.length > 6 &&
    fourcc(payload, 0) === "Exif" &&
    payload[4] === 0 &&
    payload[5] === 0
  ) {
    candidates.push(payload.subarray(6))
  }
  for (const candidate of candidates) {
    try {
      const orientation = await exifr.orientation(candidate)
      if (orientation !== undefined) return orientation
    } catch {
      // A chunk exifr cannot read is ignored. The upload stays as-is.
    }
  }
  return undefined
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

const encodeCanvas = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })

const encodeWithinSizeLimit = async (
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/webp",
): Promise<Blob | null> => {
  for (const quality of [0.92, 0.8]) {
    const blob = await encodeCanvas(canvas, type, quality)
    if (
      blob &&
      blob.size > 0 &&
      blob.size <= MAX_IMG_FILE_SIZE_BYTES &&
      (type === "image/jpeg" || blob.type === type)
    ) {
      return blob
    }
  }
  return null
}

/**
 * Phone cameras store sensor pixels sideways (or mirrored) and record the
 * correction in an EXIF Orientation tag. The viewer's computer applies that
 * tag, but the live site's WebP/AVIF derivatives do not, so the published
 * photo looks rotated or flipped.
 *
 * When the tag is not upright, rewrite the file so the pixels themselves are
 * upright and the tag is gone. JPEG stays JPEG. A still WebP stays WebP,
 * including its transparency. Upright files, animated WebP, and every other
 * type are returned unchanged. `exifr.rotateCanvas` is false once the browser
 * already applies a JPEG tag while decoding; applying it again would rotate
 * the photo twice. Chrome does not apply an EXIF tag inside WebP, so that
 * correction is drawn from the tag exifr read.
 */
export const normalizeUploadedImage = async (
  file: File,
  fileName = file.name,
): Promise<File> => {
  const webp = isWebp(file, fileName)
  if (!isJpeg(file, fileName) && !webp) return file
  if (
    typeof createImageBitmap !== "function" ||
    typeof document === "undefined"
  ) {
    return file
  }

  let bitmap: ImageBitmap | undefined
  try {
    let orientation: number | undefined
    let applyOrientation = false
    if (webp) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (isAnimatedWebp(bytes)) return file
      orientation = await readWebpOrientation(bytes)
      if (orientation === undefined || orientation === 1) return file
      if (exifr.rotations[orientation] === undefined) return file
      bitmap = await createImageBitmap(file, { imageOrientation: "none" })
      const stored = webpStoredSize(bytes)
      const swapsAxes = orientation >= 5 && orientation <= 8
      const browserAlreadySwapped =
        swapsAxes &&
        stored !== null &&
        bitmap.width === stored.height &&
        bitmap.height === stored.width
      applyOrientation = !browserAlreadySwapped
    } else {
      orientation = await exifr.orientation(file)
      if (orientation === undefined || orientation === 1) return file
      if (exifr.rotations[orientation] === undefined) return file
      bitmap = await createImageBitmap(file)
      applyOrientation = exifr.rotateCanvas
    }

    const canvas = canvasForBitmap(bitmap, orientation, applyOrientation)
    if (!canvas) return file

    const type = webp ? "image/webp" : "image/jpeg"
    const blob = await encodeWithinSizeLimit(canvas, type)
    if (!blob) return file

    return new File([blob], fileName, {
      type,
      lastModified: file.lastModified,
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
