import type { IsomerPageSchemaType, IsomerSitemap } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types/schema"
import { getSitemapAsArray } from "~/utils"

export const getMetadata = (props: IsomerPageSchemaType) => {
  const faviconUrl = `${props.site.assetsBaseUrl ?? ""}${props.site.favicon || "/favicon.ico"}`

  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    description: props.meta?.description || undefined,
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
    twitter: {
      card: "summary_large_image" as const,
    },
  }

  if (
    metadata.description === undefined &&
    props.layout === ISOMER_PAGE_LAYOUTS.Article
  ) {
    metadata.description = props.page.articlePageHeader.summary
  } else if (
    metadata.description === undefined &&
    (props.layout === ISOMER_PAGE_LAYOUTS.Content ||
      props.layout === ISOMER_PAGE_LAYOUTS.Database ||
      props.layout === ISOMER_PAGE_LAYOUTS.Index)
  ) {
    metadata.description = props.page.contentPageHeader.summary
  } else if (
    metadata.description === undefined &&
    props.layout === ISOMER_PAGE_LAYOUTS.Collection
  ) {
    metadata.description = props.page.subtitle
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
