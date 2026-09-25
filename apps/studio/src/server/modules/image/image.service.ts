import {
  generateAltText,
  isAltTextGenerationSupportedForMimeType,
} from "~/lib/generateAltText"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import type { Logger } from "@isomer/logging"

interface GenerateAltTextForUploadedImageParams {
  src: string
  mimeType: string
  pageTitle?: string
  componentType: string
  surroundingText?: string
  logger: Logger<string>
}

// Returns `undefined` (rather than throwing) whenever a usable suggestion
// can't be produced — this is a best-effort assist that pre-fills a field the
// editor can always fill in themselves, so a model/network hiccup should
// never surface as an error in the page editor.
export const generateAltTextForUploadedImage = async ({
  src,
  mimeType,
  pageTitle,
  componentType,
  surroundingText,
  logger,
}: GenerateAltTextForUploadedImageParams): Promise<string | undefined> => {
  if (!isAltTextGenerationSupportedForMimeType(mimeType)) {
    return undefined
  }

  try {
    const response = await fetch(`${ASSETS_BASE_URL}${src}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch uploaded image: ${response.status}`)
    }
    const imageBytes = new Uint8Array(await response.arrayBuffer())

    return await generateAltText({
      imageBytes,
      mimeType,
      context: { pageTitle, componentType, surroundingText },
    })
  } catch (error) {
    logger.error(
      { error, merged: { src, mimeType, componentType } },
      "Failed to generate AI alt text suggestion",
    )
    return undefined
  }
}
