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
}): PrismaJson.SiteJsonConfig =>
  // SAFETY: MSW fixture matches SiteJsonConfig fields used in Storybook/tests.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  config as PrismaJson.SiteJsonConfig

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
}): PrismaJson.BlobJsonContent =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  // SAFETY: MSW fixture matches blob layout shapes used by collection/gazette handlers.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  content as PrismaJson.BlobJsonContent

export const asFooterJsonContent = (
  content: object,
): PrismaJson.FooterJsonContent =>
  // SAFETY: MSW fixture matches FooterJsonContent fields used in Storybook/tests.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  content as PrismaJson.FooterJsonContent

export const asNavbarJsonContent = (
  content: object,
): PrismaJson.NavbarJsonContent =>
  // SAFETY: MSW fixture matches NavbarJsonContent fields used in Storybook/tests.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  content as PrismaJson.NavbarJsonContent
