import { env } from "~/env.mjs"

export const generateAssetUrl = (url: string): string => {
  return url.startsWith("/")
    ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${url}`
    : url
}
