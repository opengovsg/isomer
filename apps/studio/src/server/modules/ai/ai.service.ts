import { TRPCError } from "@trpc/server"
import { env } from "~/env.mjs"
import {
  generateAltTextWithValidationRetry,
  isAltTextGenerationSupportedForMimeType,
} from "~/lib/generateAltText"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import type { Logger } from "@isomer/logging"

import {
  getContentTypeFromKey,
  parseAssetUrlToKey,
} from "../asset/asset.service"

interface GenerateAltTextForUploadedImageParams {
  fileKey: string
  logger: Logger<string>
  abortSignal?: AbortSignal
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

export const generateAltTextForUploadedImage = async ({
  fileKey,
  logger,
  abortSignal,
}: GenerateAltTextForUploadedImageParams): Promise<string> => {
  const mimeType = getContentTypeFromKey(fileKey)
  if (!isAltTextGenerationSupportedForMimeType(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This file type cannot be described",
    })
  }

  if (!ASSETS_BASE_URL) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate alt text",
    })
  }

  const imageUrl = `${ASSETS_BASE_URL}/${fileKey}`

  try {
    const head = await fetch(imageUrl, { method: "HEAD", signal: abortSignal })
    if (!head.ok) {
      throw new Error(`Uploaded image is not accessible: ${head.status}`)
    }

    return await generateAltTextWithValidationRetry(imageUrl, abortSignal)
  } catch (error) {
    if (abortSignal?.aborted) throw error
    logger.error(
      { error, merged: { fileKey, mimeType } },
      "Failed to generate AI alt text suggestion",
    )
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate alt text",
      cause: error,
    })
  }
}
