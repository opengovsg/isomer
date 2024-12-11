import type { IsomerPageSchemaType, IsomerSitemap } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types"
import { getSitemapAsArray } from "~/utils"

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

export const getMetadata = (props: IsomerPageSchemaType) => {
  const faviconUrl = `${props.site.assetsBaseUrl ?? ""}${props.site.favicon || "/favicon.ico"}`
  const canonicalUrl = props.site.url
    ? new URL(props.page.permalink, props.site.url).toString()
    : props.page.permalink
  const metaImage = getMetaImage(props)
  const metaImageUrl = `${props.site.assetsBaseUrl ?? ""}${metaImage ?? props.site.logoUrl}`

  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
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
      title: props.page.title,
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
  }

  if (props.page.permalink === "/") {
    return { ...metadata }
  }

  return {
    ...metadata,
    title: props.page.title,
  }
}

export const getRobotsTxt = (props: IsomerPageSchemaType) => {
  const rules = [
    {
      userAgent: "*",
      allow: "/",
    },
  ]

  return {
    sitemap: props.site.url ? `${props.site.url}/sitemap.xml` : undefined,
    rules:
      props.site.environment === "staging"
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
