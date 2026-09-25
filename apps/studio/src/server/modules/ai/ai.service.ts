import { env } from "~/env.mjs"
import {
  generateAltText,
  isAltTextGenerationSupportedForMimeType,
} from "~/lib/generateAltText"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import type { Logger } from "@isomer/logging"

import { parseAssetUrlToKey } from "../asset/asset.service"

interface GenerateAltTextForUploadedImageParams {
  fileKey: string
  mimeType: string
  componentType: string
  logger: Logger<string>
}

// `src` is a client-supplied path. Concatenating it onto the asset host lets
// a value like `@169.254.169.254/...` retarget the request. Return only a
// canonical `${siteId}/${uuid}/${file}` key on the asset domain. The router
// must still reject keys that do not belong to the caller's site.
export const parseUploadedImageKey = (src: string): string | null => {
  if (!ASSETS_BASE_URL || !env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(src, ASSETS_BASE_URL)
  } catch {
    return null
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== "" ||
    parsed.hostname !== env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
  ) {
    return null
  }

  return parseAssetUrlToKey(parsed.href)
}

// Returns `undefined` (rather than throwing) whenever a usable suggestion
// can't be produced — this is a best-effort assist that pre-fills a field the
// editor can always fill in themselves, so a model/network hiccup should
// never surface as an error in the page editor.
export const generateAltTextForUploadedImage = async ({
  fileKey,
  mimeType,
  componentType,
  logger,
}: GenerateAltTextForUploadedImageParams): Promise<string | undefined> => {
  if (!isAltTextGenerationSupportedForMimeType(mimeType) || !ASSETS_BASE_URL) {
    return undefined
  }

  const imageUrl = `${ASSETS_BASE_URL}/${fileKey}`

  try {
    const head = await fetch(imageUrl, { method: "HEAD" })
    if (!head.ok) {
      throw new Error(`Uploaded image is not accessible: ${head.status}`)
    }

    return await generateAltText(imageUrl)
  } catch (error) {
    logger.error(
      { error, merged: { fileKey, mimeType, componentType } },
      "Failed to generate AI alt text suggestion",
    )
    return undefined
  }
}
