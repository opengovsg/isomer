import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { useMutation } from "@tanstack/react-query"
import { backOff } from "exponential-backoff"
import {
  getAssetUploadBackoffBudgetMs,
  getAssetUploadBackoffOptions,
} from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import {
  BAKEABLE_FORMAT_BY_MIME,
  bakeImageWithinSizeLimit,
  canBakeImage,
  mimeFromKeyExtension,
} from "~/lib/imageBake"
import { performUpload } from "~/lib/storage/client"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"
import {
  generateAssetUrl,
  generateOriginalAssetUrl,
} from "~/utils/generateAssetUrl"
import { trpc } from "~/utils/trpc"

// Must exceed the malware-scan poll's own worst-case budget (≈63s), or a save
// that's still legitimately polling gets cut off mid-poll.
export const SAVE_TIMEOUT_MS = getAssetUploadBackoffBudgetMs() + 15_000

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
 * @param maxBytes - Fetch only the first N bytes (HTTP Range), for header sniffing
 */
export const fetchImageBlob = async (
  key: string,
  signal?: AbortSignal,
  maxBytes?: number,
): Promise<Blob> => {
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
  const range = maxBytes ? { Range: `bytes=0-${maxBytes - 1}` } : undefined
  const blob =
    (await tryFetch(originalUrl, { headers: range, signal })) ??
    (plainUrl !== originalUrl
      ? await tryFetch(plainUrl, {
          headers: { Accept: "image/webp", ...range },
          signal,
        })
      : null)
  // tryFetch swallows the abort, so surface the deadline's own reason here.
  signal?.throwIfAborted()
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

export interface SaveImageAdjustmentVariables {
  currentSrc: string
  draft: ImageAdjustment
  // The retained client-side original bytes, when the image being edited was
  // uploaded this session. Bakes from these directly (no fetch), so a save
  // works even while the uploaded original is still gated by the scan window.
  originalFile?: Blob
}

export interface SaveImageAdjustmentResult {
  src: string
  imageAdjustment: ImageAdjustment
}

const SAVE_TIMEOUT_MESSAGE = "Saving took too long. Please try again."

/**
 * Hook to save an image adjustment via the fail-safe order:
 * 1. Bake the original image
 * 2. Upload the bake to S3
 * 3. Wait for the upload to clear the malware scan (readable)
 * 4. Only on success, return the new src + imageAdjustment with originalKey set
 * Any earlier failure leaves the blob untouched.
 *
 * Built on useMutation (see useUploadAssetMutation for the house pattern). A
 * single AbortController bounds the whole mutationFn to SAVE_TIMEOUT_MS, so
 * isPending reflects real completion -- callers don't need their own flag.
 */
export const useSaveImageAdjustment = ({
  siteId,
  resourceId,
}: UseSaveImageAdjustmentInput) => {
  const { mutateAsync: getPresignedPutUrlForBake } =
    trpc.asset.getPresignedPutUrlForBake.useMutation()

  return useMutation<
    SaveImageAdjustmentResult,
    Error,
    SaveImageAdjustmentVariables
  >({
    mutationFn: async ({ currentSrc, draft, originalFile }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(new Error(SAVE_TIMEOUT_MESSAGE)),
        SAVE_TIMEOUT_MS,
      )

      try {
        // Step 1: Resolve the original key
        const originalKey = resolveOriginalKey(currentSrc, draft)

        validateCropBounds(draft.crop)

        // Step 2: Get the bytes to bake — the retained client-side original if
        // we have it (no fetch; works while the uploaded original is still
        // gated), else fetch, preferring the pristine original and falling back
        // to the plain URL (see fetchImageBlob).
        const originalBlob =
          originalFile ??
          (await fetchImageBlob(`/${originalKey}`, controller.signal))

        // Step 3: Choose the MIME type for baking
        const mime = chooseBakeMime(originalBlob.type, originalKey)

        // Step 4: Bake the image, backing off quality (JPEG/WebP only) if the
        // full-quality encode would exceed the server's size cap -- a crop
        // re-encoded through canvas can end up larger than a well-optimized
        // source even at default quality, so a source that passed the
        // upload-time size check can still fail here with no earlier warning.
        // bakeImage itself rejects animated sources (WebP/APNG pass the MIME
        // gate but would flatten). Canvas work can't be interrupted mid-encode,
        // so just skip starting it past the deadline.
        if (controller.signal.aborted) throw new Error(SAVE_TIMEOUT_MESSAGE)
        const bakedBlob = await bakeImageWithinSizeLimit(originalBlob, draft, {
          mimeType: mime,
          maxBytes: MAX_IMG_FILE_SIZE_BYTES,
        })
        if (bakedBlob.size > MAX_IMG_FILE_SIZE_BYTES) {
          throw new Error(
            `This edited image is too large to save (over ${formatFileSizeLimit({ bytes: MAX_IMG_FILE_SIZE_BYTES })}). Try cropping to a smaller region, or use a smaller source image.`,
          )
        }

        // Step 5: Get the extension for the baked image
        const ext =
          BAKEABLE_FORMAT_BY_MIME[mime as keyof typeof BAKEABLE_FORMAT_BY_MIME]

        // Step 6: Get presigned PUT URL for the bake. tRPC's mutateAsync has
        // no signal passthrough, so this call isn't abortable mid-flight --
        // still bail up front if the deadline already passed.
        if (controller.signal.aborted) throw new Error(SAVE_TIMEOUT_MESSAGE)
        const { fileKey, uploadConfig } = await getPresignedPutUrlForBake({
          siteId,
          resourceId: resourceId || "",
          src: currentSrc,
          // Keeps the uploader's filename in the baked key (derived from the
          // true original, so re-edits don't accumulate suffixes).
          originalKey,
          ext,
          fileSize: bakedBlob.size,
        })

        // Step 7: Upload the baked image to S3
        const file = new File([bakedBlob], `baked.${ext}`, { type: mime })
        await performUpload(file, fileKey, uploadConfig, controller.signal)

        // Step 8: Wait for the malware scan to tag the upload as readable, so
        // repointing the block doesn't momentarily 403 (see useAssetUpload).
        // The retry predicate stops the loop once the deadline fires, since
        // the delay between retries isn't itself abortable.
        await backOff(
          async () => {
            const response = await fetch(generateAssetUrl(`/${fileKey}`), {
              signal: controller.signal,
            })
            if (!response.ok) {
              throw new Error(`Unable to read from ${fileKey}`)
            }
          },
          {
            ...getAssetUploadBackoffOptions({}),
            retry: () => !controller.signal.aborted,
          },
        )

        // Step 9: Return the new src and imageAdjustment
        return {
          src: `/${fileKey}`,
          imageAdjustment: {
            ...draft,
            originalKey,
          },
        }
      } finally {
        clearTimeout(timeoutId)
      }
    },
    retry: false,
  })
}
