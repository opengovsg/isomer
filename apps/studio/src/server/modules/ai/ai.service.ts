import { env } from "~/env.mjs"
import {
  generateAltText,
  isAltTextGenerationSupportedForMimeType,
} from "~/lib/generateAltText"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import type { Logger } from "@isomer/logging"

import {
  doAllFileKeysBelongToSite,
  parseAssetUrlToKey,
} from "../asset/asset.service"

interface GenerateAltTextForUploadedImageParams {
  siteId: number
  src: string
  mimeType: string
  componentType: string
  logger: Logger<string>
}

// `src` is a client-supplied path. Concatenating it onto the asset host lets
// a value like `@169.254.169.254/...` retarget the request, and a path under
// another site id would describe that site's file. Resolve only a canonical
// `https://<asset-domain>/<siteId>/<uuid>/<file>` URL for this site.
const resolveUploadedImageUrl = ({
  src,
  siteId,
}: {
  src: string
  siteId: number
}): string | undefined => {
  if (!ASSETS_BASE_URL || !env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME) {
    return undefined
  }

  let parsed: URL
  try {
    parsed = new URL(src, ASSETS_BASE_URL)
  } catch {
    return undefined
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== "" ||
    parsed.hostname !== env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
  ) {
    return undefined
  }

  const key = parseAssetUrlToKey(parsed.href)
  if (!key || !doAllFileKeysBelongToSite({ fileKeys: [key], siteId })) {
    return undefined
  }

  return `${ASSETS_BASE_URL}/${key}`
}

// Returns `undefined` (rather than throwing) whenever a usable suggestion
// can't be produced — this is a best-effort assist that pre-fills a field the
// editor can always fill in themselves, so a model/network hiccup should
// never surface as an error in the page editor.
export const generateAltTextForUploadedImage = async ({
  siteId,
  src,
  mimeType,
  componentType,
  logger,
}: GenerateAltTextForUploadedImageParams): Promise<string | undefined> => {
  if (!isAltTextGenerationSupportedForMimeType(mimeType)) {
    return undefined
  }

  const imageUrl = resolveUploadedImageUrl({ src, siteId })
  if (!imageUrl) {
    logger.error(
      { merged: { src, mimeType, componentType, siteId } },
      "Rejected alt text generation for a non-site asset URL",
    )
    return undefined
  }

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
