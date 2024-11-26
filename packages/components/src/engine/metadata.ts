import type { IsomerPageSchemaType, IsomerSitemap } from "~/types"
import { getSitemapAsArray } from "~/utils"

const getMetaDescription = (props: IsomerPageSchemaType) => {
  if (props.meta?.description) {
    return props.meta.description
  }

  switch (props.layout) {
    case "article":
      return props.page.articlePageHeader.summary
    case "content":
    case "database":
    case "index":
      return props.page.contentPageHeader.summary
    case "collection":
      return props.page.subtitle
    case "homepage":
      return props.content.find((item) => item.type === "hero")?.subtitle
    case "file":
    case "link":
    case "search":
    case "notfound":
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
    case "article":
      return props.page.image?.src || props.meta?.image
    case "content":
    case "database":
    case "index":
    case "collection":
      return props.meta?.image
    case "homepage":
      return (
        props.content.find((item) => item.type === "hero")?.backgroundUrl ||
        props.meta?.image
      )
    case "file":
    case "link":
    case "search":
    case "notfound":
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
  const fullUrl = props.site.url
    ? new URL(props.page.permalink, props.site.url).toString()
    : props.page.permalink
  const metaImage = getMetaImage(props)
  const metaImageUrl = metaImage
    ? `${props.site.assetsBaseUrl ?? ""}${metaImage}`
    : undefined

  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    description: getMetaDescription(props),
    robots: {
      index:
        props.layout !== "file" &&
        props.layout !== "link" &&
        props.layout !== "search" &&
        props.layout !== "notfound" &&
        !props.meta?.noIndex,
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
    },
    openGraph: {
      title: props.page.title,
      description: getMetaDescription(props),
      url: fullUrl,
      siteName: props.site.siteName,
      type: props.layout === "article" ? "article" : "website",
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
    return metadata
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
    .filter((item) => item.layout !== "file" && item.layout !== "link")
    .map(({ permalink, lastModified }) => ({
      url: siteUrl !== undefined ? `${siteUrl}${permalink}` : permalink,
      lastModified,
    }))
}
