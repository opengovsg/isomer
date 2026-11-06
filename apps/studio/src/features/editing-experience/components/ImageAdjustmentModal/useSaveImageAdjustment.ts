import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { backOff } from "exponential-backoff"
import { useState } from "react"
import { getAssetUploadBackoffOptions } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import {
  BAKEABLE_FORMAT_BY_MIME,
  bakeImage,
  canBakeImage,
  isAnimatedImageBlob,
  mimeFromKeyExtension,
} from "~/lib/imageBake"
import { performUpload } from "~/lib/storage/client"
import {
  generateAssetUrl,
  generateOriginalAssetUrl,
} from "~/utils/generateAssetUrl"
import { trpc } from "~/utils/trpc"

/**
 * Resolve the original image key from the current src and draft adjustment.
 * On first edit (no prior adjustment), the current src IS the original.
 * @param currentSrc - The current image src (e.g., "/path/to/original.jpg")
 * @param draft - The draft adjustment object (originalKey may be undefined on first edit)
 * @returns The original file key without leading slash
 */
export const resolveOriginalKey = (
  currentSrc: string,
  draft: Pick<ImageAdjustment, "originalKey"> | { originalKey?: string },
): string => {
  return draft.originalKey || currentSrc.replace(/^\//, "")
}

/**
 * Choose the MIME type to use for baking, preserving the original format.
 * Unsupported formats are rejected rather than silently flattened to JPEG,
 * which would rasterize vectors (SVG) and drop animation frames (GIF/APNG).
 *
 * Prefers the fetched blob's Content-Type, but falls back to the key's
 * (server-validated) extension when that type is missing or generic — a CDN
 * can serve a real PNG as "binary/octet-stream", which must not block a save.
 * @param originalType - The original image MIME type (from the HTTP response)
 * @param originalKey - The original image key, used for the extension fallback
 * @returns The MIME type to use for baking
 * @throws If the original format cannot be baked (see BAKEABLE_FORMAT_BY_MIME)
 */
export const chooseBakeMime = (
  originalType: string,
  originalKey: string,
): string => {
  if (canBakeImage(originalType)) return originalType

  const fromExtension = mimeFromKeyExtension(originalKey)
  if (fromExtension) return fromExtension

  throw new Error(
    `This image can't be adjusted. Only JPEG, PNG, and WebP images are supported (got "${originalType}").`,
  )
}

/**
 * Fetch image bytes for baking, preferring the pristine original (transcode
 * bypass) and falling back to the plain (transcoded) URL when the original is
 * inaccessible — the ?original object is gated by a malware-scan tag and 403s
 * for unscanned/just-uploaded or post-conversion-deleted originals. Throws on a
 * non-ok response so a 403 XML body is never mistaken for image bytes.
 * @param key - The image key with leading slash (e.g. "/site/uuid/file.png")
 */
export const fetchImageBlob = async (key: string): Promise<Blob> => {
  const originalUrl = generateOriginalAssetUrl(key)
  const plainUrl = generateAssetUrl(key)

  // Each attempt is isolated so a thrown ?original never skips the plain
  // fallback: the ?original object is gated by a malware-scan tag and can 403,
  // and that error response can be CORS-opaque, making the fetch *throw* rather
  // than resolve with !ok. A bare `await fetch(originalUrl)` would then abort the
  // whole save before the fallback ran.
  const tryFetch = async (
    url: string,
    init?: RequestInit,
  ): Promise<Blob | null> => {
    try {
      const response = await fetch(url, init)
      return response.ok ? await response.blob() : null
    } catch {
      return null
    }
  }

  // Force the webp variant (not avif) on the fallback: the CDN picks the format
  // from Accept, and the baker only accepts jpeg/png/webp (BAKEABLE_FORMAT_BY_MIME),
  // so a default */* (avif) fetch would be rejected downstream.
  const blob =
    (await tryFetch(originalUrl)) ??
    (plainUrl !== originalUrl
      ? await tryFetch(plainUrl, { headers: { Accept: "image/webp" } })
      : null)
  if (!blob) {
    throw new Error(`Failed to fetch image: ${key}`)
  }
  return blob
}

/**
 * Guard against an out-of-bounds or zero-area crop before baking. The schema
 * only bounds each field independently to [0,1]; nothing upstream enforces
 * that a crop rectangle actually fits inside the image or has any area --
 * a zero-width/height crop reaches canvas drawImage() and throws there instead.
 * @param crop - The draft's crop rectangle
 * @throws If the crop extends past the image's right or bottom edge, or has no area
 */
export const validateCropBounds = (crop: ImageAdjustment["crop"]): void => {
  if (
    crop.x + crop.width > 1 ||
    crop.y + crop.height > 1 ||
    crop.width <= 0 ||
    crop.height <= 0
  ) {
    throw new Error(
      `Invalid crop: (x=${crop.x}, width=${crop.width}, y=${crop.y}, height=${crop.height}) extends outside the image or has no area.`,
    )
  }
}

interface UseSaveImageAdjustmentInput {
  siteId: number
  resourceId?: string
}

interface UseSaveImageAdjustmentOutput {
  save: (
    currentSrc: string,
    draft: ImageAdjustment,
    // The retained client-side original bytes, when the image being edited was
    // uploaded this session. Bakes from these directly (no fetch), so a save
    // works even while the uploaded original is still gated by the scan window.
    originalFile?: Blob,
  ) => Promise<{ src: string; imageAdjustment: ImageAdjustment }>
  isSaving: boolean
  error: Error | null
}

/**
 * Hook to save an image adjustment via the fail-safe order:
 * 1. Bake the original image
 * 2. Upload the bake to S3
 * 3. Wait for the upload to clear the malware scan (readable)
 * 4. Only on success, return the new src + imageAdjustment with originalKey set
 * Any earlier failure leaves the blob untouched.
 */
export const useSaveImageAdjustment = ({
  siteId,
  resourceId,
}: UseSaveImageAdjustmentInput): UseSaveImageAdjustmentOutput => {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { mutateAsync: getPresignedPutUrlForBake } =
    trpc.asset.getPresignedPutUrlForBake.useMutation()

  const save = async (
    currentSrc: string,
    draft: ImageAdjustment,
    originalFile?: Blob,
  ): Promise<{ src: string; imageAdjustment: ImageAdjustment }> => {
    setIsSaving(true)
    setError(null)

    try {
      // Step 1: Resolve the original key
      const originalKey = resolveOriginalKey(currentSrc, draft)

      validateCropBounds(draft.crop)

      // Step 2: Get the bytes to bake — the retained client-side original if we
      // have it (no fetch; works while the uploaded original is still gated),
      // else fetch, preferring the pristine original and falling back to the
      // plain URL (see fetchImageBlob).
      const originalBlob =
        originalFile ?? (await fetchImageBlob(`/${originalKey}`))

      // Step 3: Choose the MIME type for baking
      const mime = chooseBakeMime(originalBlob.type, originalKey)

      // Reject animated WebP/APNG: they pass the MIME gate but baking would
      // flatten them to a single frame and drop the animation.
      if (await isAnimatedImageBlob(originalBlob)) {
        throw new Error(
          "This image can't be adjusted because it's animated. Adjusting would flatten it to a single frame.",
        )
      }

      // Step 4: Bake the image
      const bakedBlob = await bakeImage(originalBlob, draft, {
        mimeType: mime,
      })

      // Step 5: Get the extension for the baked image
      const ext =
        BAKEABLE_FORMAT_BY_MIME[mime as keyof typeof BAKEABLE_FORMAT_BY_MIME]

      // Step 6: Get presigned PUT URL for the bake
      const { fileKey, uploadConfig } = await getPresignedPutUrlForBake({
        siteId,
        resourceId: resourceId || "",
        src: currentSrc,
        // Keeps the uploader's filename in the baked key (derived from the true
        // original, so re-edits don't accumulate suffixes).
        originalKey,
        ext,
        fileSize: bakedBlob.size,
      })

      // Step 7: Upload the baked image to S3
      const file = new File([bakedBlob], `baked.${ext}`, { type: mime })
      await performUpload(file, fileKey, uploadConfig)

      // Step 8: Wait for the malware scan to tag the upload as readable, so
      // repointing the block doesn't momentarily 403 (see useAssetUpload).
      await backOff(async () => {
        const response = await fetch(generateAssetUrl(`/${fileKey}`))
        if (!response.ok) {
          throw new Error(`Unable to read from ${fileKey}`)
        }
      }, getAssetUploadBackoffOptions({}))

      // Step 9: Return the new src and imageAdjustment
      return {
        src: `/${fileKey}`,
        imageAdjustment: {
          ...draft,
          originalKey,
        },
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return { save, isSaving, error }
}
