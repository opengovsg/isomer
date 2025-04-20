import { env } from "~/env.mjs"

export const ASSETS_BASE_URL = env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
  ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
  : ""

export const generateAssetUrl = (url: string): string => {
  return url.startsWith("/") ? `${ASSETS_BASE_URL}${url}` : url
}
