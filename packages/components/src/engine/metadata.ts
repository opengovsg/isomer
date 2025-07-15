import type { IsomerPageSchemaType, IsomerSitemap } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types"
import { getSitemapAsArray } from "~/utils"

const getMetaTitle = (props: IsomerPageSchemaType) => {
  // NOTE: We show the site name as the title for the homepage, as places like
  // WhatsApp do not use the site_name property of the OpenGraph metadata when
  // displaying the page preview, which can be confusing for users
  return props.page.permalink === "/" ? props.site.siteName : props.page.title
}

const getMetaDescription = (props: IsomerPageSchemaType) => {
  if (props.meta?.description) {
    return props.meta.description
  }

  switch (props.layout) {
    case ISOMER_PAGE_LAYOUTS.Article:
      return props.page.articlePageHeader.summary
    case ISOMER_PAGE_LAYOUTS.Content:
    case ISOMER_PAGE_LAYOUTS.Database:
    case ISOMER_PAGE_LAYOUTS.Index:
      return props.page.contentPageHeader.summary
    case ISOMER_PAGE_LAYOUTS.Collection:
      return props.page.subtitle
    case ISOMER_PAGE_LAYOUTS.Homepage:
      return props.content.find((item) => item.type === "hero")?.subtitle
    case ISOMER_PAGE_LAYOUTS.File:
    case ISOMER_PAGE_LAYOUTS.Link:
    case ISOMER_PAGE_LAYOUTS.Search:
    case ISOMER_PAGE_LAYOUTS.NotFound:
      // NOTE: These pages do not appear in search results, so we don't need to
      // provide a meta description
      return undefined
    default:
      const _: never = props
      return undefined
  }
}

const getMetaImage = (props: IsomerPageSchemaType) => {
  switch (props.layout) {
    case ISOMER_PAGE_LAYOUTS.Article:
      return props.meta?.image || props.page.image?.src
    case ISOMER_PAGE_LAYOUTS.Content:
    case ISOMER_PAGE_LAYOUTS.Database:
    case ISOMER_PAGE_LAYOUTS.Index:
    case ISOMER_PAGE_LAYOUTS.Collection:
      return props.meta?.image
    case ISOMER_PAGE_LAYOUTS.Homepage:
      return (
        props.meta?.image ||
        props.content.find((item) => item.type === "hero")?.backgroundUrl
      )
    case ISOMER_PAGE_LAYOUTS.File:
    case ISOMER_PAGE_LAYOUTS.Link:
    case ISOMER_PAGE_LAYOUTS.Search:
    case ISOMER_PAGE_LAYOUTS.NotFound:
      // NOTE: These pages do not appear in search results, so we don't need to
      // provide a meta description
      return undefined
    default:
      const _: never = props
      return undefined
  }
}

// NOTE: We throw an error for malformed site URLs to ensure data integrity.
// The schema serves as our contract - when inputs don't match expectations,
// we should fail fast rather than accommodate inconsistent data formats.
const getCanonicalUrl = (props: IsomerPageSchemaType) => {
  if (!props.site.url) return props.page.permalink

  if (!props.site.url.startsWith("https://")) {
    throw new Error(
      "Invalid site.url. Must be a valid URL starting with https://",
    )
  }

  try {
    return new URL(props.page.permalink, props.site.url).toString()
  } catch {
    throw new Error("Invalid site URL or permalink.")
  }
}

export const getMetadata = (props: IsomerPageSchemaType) => {
  const faviconUrl = `${props.site.assetsBaseUrl ?? ""}${props.site.favicon || "/favicon.ico"}`
  const canonicalUrl = getCanonicalUrl(props)
  const metaImage = getMetaImage(props)
  const metaImageUrl = `${props.site.assetsBaseUrl ?? ""}${metaImage ?? props.site.logoUrl}`

  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    title: getMetaTitle(props),
    description: getMetaDescription(props),
    robots: {
      index:
        props.layout !== ISOMER_PAGE_LAYOUTS.File &&
        props.layout !== ISOMER_PAGE_LAYOUTS.Link &&
        props.layout !== ISOMER_PAGE_LAYOUTS.Search &&
        props.layout !== ISOMER_PAGE_LAYOUTS.NotFound &&
        !props.meta?.noIndex,
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
    },
    openGraph: {
      title: getMetaTitle(props),
      description: getMetaDescription(props),
      url: canonicalUrl,
      siteName: props.site.siteName,
      type:
        props.layout === ISOMER_PAGE_LAYOUTS.Article ? "article" : "website",
      images: !!metaImageUrl
        ? [
            {
              url: metaImageUrl,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }

  return metadata
}

export const shouldBlockIndexing = (
  environment: IsomerPageSchemaType["site"]["environment"],
): boolean => {
  return environment !== "production"
}

export const getRobotsTxt = (props: IsomerPageSchemaType) => {
  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/search"],
    },
  ]

  return {
    sitemap: props.site.url ? `${props.site.url}/sitemap.xml` : undefined,
    rules: shouldBlockIndexing(props.site.environment)
      ? {
          userAgent: "*",
          disallow: "/",
        }
      : rules,
  }
}

export const getSitemapXml = (sitemap: IsomerSitemap, siteUrl?: string) => {
  return getSitemapAsArray(sitemap)
    .filter(
      (item) =>
        item.layout !== ISOMER_PAGE_LAYOUTS.File &&
        item.layout !== ISOMER_PAGE_LAYOUTS.Link,
    )
    .map(({ permalink, lastModified }) => ({
      url: siteUrl !== undefined ? `${siteUrl}${permalink}` : permalink,
      lastModified,
    }))
}
