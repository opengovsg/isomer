import {
  generateAltText,
  isAltTextGenerationSupportedForMimeType,
} from "~/lib/generateAltText"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import type { Logger } from "@isomer/logging"

interface GenerateAltTextForUploadedImageParams {
  src: string
  mimeType: string
  componentType: string
  logger: Logger<string>
}

// Returns `undefined` (rather than throwing) whenever a usable suggestion
// can't be produced — this is a best-effort assist that pre-fills a field the
// editor can always fill in themselves, so a model/network hiccup should
// never surface as an error in the page editor.
export const generateAltTextForUploadedImage = async ({
  src,
  mimeType,
  componentType,
  logger,
}: GenerateAltTextForUploadedImageParams): Promise<string | undefined> => {
  if (!isAltTextGenerationSupportedForMimeType(mimeType)) {
    return undefined
  }

  const imageUrl = `${ASSETS_BASE_URL}${src}`

  try {
    const head = await fetch(imageUrl, { method: "HEAD" })
    if (!head.ok) {
      throw new Error(`Uploaded image is not accessible: ${head.status}`)
    }

    return await generateAltText(imageUrl)
  } catch (error) {
    logger.error(
      { error, merged: { src, mimeType, componentType } },
      "Failed to generate AI alt text suggestion",
    )
    return undefined
  }
}
