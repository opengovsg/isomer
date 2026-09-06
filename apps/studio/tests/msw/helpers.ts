/** MSW fixture helpers — single SAFETY boundary for PrismaJson opaque types. */

export const asSiteJsonConfig = (config: {
  theme: string
  siteName: string
  url: string
  logoUrl: string
  search: undefined
  isGovernment: boolean
  agencyName?: string
  favicon?: string
}): PrismaJson.SiteJsonConfig => {
  // SAFETY: MSW fixture matches SiteJsonConfig fields used in Storybook/tests.
  return config as PrismaJson.SiteJsonConfig
}

export const asSiteThemeJson = (
  theme: PrismaJson.SiteThemeJson,
): PrismaJson.SiteThemeJson => theme

interface BlobJsonPageFixture {
  ref?: string
  date?: string
  category?: string
  description?: string
  tagged?: string[]
  summary?: string
  image?: { src: string; alt: string }
}

export const asBlobJsonContent = (content: {
  layout: string
  page: BlobJsonPageFixture
  content: unknown[]
  version: string
}): PrismaJson.BlobJsonContent => {
  // SAFETY: MSW fixture matches blob layout shapes used by collection/gazette handlers.
  return content as PrismaJson.BlobJsonContent
}
