import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { useMutation } from "@tanstack/react-query"
import { backOff } from "exponential-backoff"
import { getAssetUploadBackoffOptions } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import { BAKEABLE_FORMAT_BY_MIME, bakeImage, canBakeImage } from "~/lib/imageBake"
import { performUpload } from "~/lib/storage/client"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"
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
 * @param originalType - The original image MIME type
 * @returns The MIME type to use for baking
 * @throws If the original format cannot be baked (see BAKEABLE_FORMAT_BY_MIME)
 */
export const chooseBakeMime = (originalType: string): string => {
  if (!canBakeImage(originalType)) {
    throw new Error(
      `This image can't be adjusted. Only JPEG, PNG, and WebP images are supported (got "${originalType}").`,
    )
  }
  return originalType
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
}

export interface SaveImageAdjustmentResult {
  src: string
  imageAdjustment: ImageAdjustment
}

/**
 * Hook to save an image adjustment via the fail-safe order:
 * 1. Bake the original image
 * 2. Upload the bake to S3
 * 3. Wait for the upload to clear the malware scan (readable)
 * 4. Only on success, return the new src + imageAdjustment with originalKey set
 * Any earlier failure leaves the blob untouched.
 *
 * Built on useMutation (see useUploadAssetMutation for the house pattern) so
 * isPending/error bookkeeping isn't hand-rolled — isPending in particular is a
 * more reliable signal than a manual ref for "is a save still really running",
 * since it only flips false when this mutationFn settles.
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
    mutationFn: async ({ currentSrc, draft }) => {
      // Step 1: Resolve the original key
      const originalKey = resolveOriginalKey(currentSrc, draft)

      validateCropBounds(draft.crop)

      // Step 2: Fetch the original blob from S3
      const originalUrl = `${ASSETS_BASE_URL}/${originalKey}`
      const originalResponse = await fetch(originalUrl)
      if (!originalResponse.ok) {
        throw new Error(
          `Failed to fetch the original image (status ${originalResponse.status}).`,
        )
      }
      const originalBlob = await originalResponse.blob()

      // Step 3: Choose the MIME type for baking
      const mime = chooseBakeMime(originalBlob.type)

      // Step 4: Bake the image — bakeImage rejects an animated source itself
      // (WebP/APNG pass the MIME gate but would flatten to a single frame),
      // so there's no separate pre-check here; its error message is already
      // user-facing and surfaces directly in the save-failure toast.
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
        ext,
        fileSize: bakedBlob.size,
      })

      // Step 7: Upload the baked image to S3
      const file = new File([bakedBlob], `baked.${ext}`, { type: mime })
      await performUpload(file, fileKey, uploadConfig)

      // Step 8: Wait for the malware scan to tag the upload as readable, so
      // repointing the block doesn't momentarily 403 (see useAssetUpload).
      await backOff(async () => {
        const response = await fetch(`${ASSETS_BASE_URL}/${fileKey}`)
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
    },
    retry: false,
  })
}
