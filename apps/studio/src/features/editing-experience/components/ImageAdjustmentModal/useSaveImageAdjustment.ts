import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { useState } from "react"
import { env } from "~/env.mjs"
import {
  BAKEABLE_FORMAT_BY_MIME,
  bakeImage,
  canBakeImage,
  isAnimatedImageBlob,
} from "~/lib/imageBake"
import { performUpload } from "~/lib/storage/client"
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

interface UseSaveImageAdjustmentInput {
  siteId: number
  resourceId?: string
}

interface UseSaveImageAdjustmentOutput {
  save: (
    currentSrc: string,
    draft: ImageAdjustment,
  ) => Promise<{ src: string; imageAdjustment: ImageAdjustment }>
  isSaving: boolean
  error: Error | null
}

/**
 * Hook to save an image adjustment via the fail-safe order:
 * 1. Bake the original image
 * 2. Upload the bake to S3
 * 3. Only on success, return the new src + imageAdjustment with originalKey set
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
  ): Promise<{ src: string; imageAdjustment: ImageAdjustment }> => {
    setIsSaving(true)
    setError(null)

    try {
      // Step 1: Resolve the original key
      const originalKey = resolveOriginalKey(currentSrc, draft)

      // Step 2: Fetch the original blob from S3
      const originalUrl = `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}/${originalKey}`
      const originalResponse = await fetch(originalUrl)
      if (!originalResponse.ok) {
        throw new Error(
          `Failed to fetch the original image (status ${originalResponse.status}).`,
        )
      }
      const originalBlob = await originalResponse.blob()

      // Step 3: Choose the MIME type for baking
      const mime = chooseBakeMime(originalBlob.type)

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
        ext,
        fileSize: bakedBlob.size,
      })

      // Step 7: Upload the baked image to S3
      const file = new File([bakedBlob], `baked.${ext}`, { type: mime })
      await performUpload(file, fileKey, uploadConfig)

      // Step 8: Return the new src and imageAdjustment
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
