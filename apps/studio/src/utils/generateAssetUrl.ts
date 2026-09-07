import { env } from "~/env.mjs"
import { hasNonEmptyString } from "~/utils/truthiness"

export const ASSETS_BASE_URL = hasNonEmptyString(
  env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
)
  ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
  : ""

export const generateAssetUrl = (url: string): string =>
  hasNonEmptyString(url) && url.startsWith("/")
    ? `${ASSETS_BASE_URL}${url}`
    : url
