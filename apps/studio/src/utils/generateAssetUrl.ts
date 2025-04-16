import { env } from "~/env.mjs"

export const generateAssetBaseUrl = (): string => {
  return env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
    ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
    : ""
}

export const generateAssetUrl = (url: string): string => {
  return url.startsWith("/") ? `${generateAssetBaseUrl()}${url}` : url
}
