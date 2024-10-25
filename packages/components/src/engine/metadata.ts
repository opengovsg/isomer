import type { IsomerPageSchemaType, IsomerSitemap } from "~/types"
import { getSitemapAsArray } from "~/utils"

export const getMetadata = (props: IsomerPageSchemaType) => {
  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    description: props.meta?.description || undefined,
    robots: {
      index:
        props.layout !== "file" &&
        props.layout !== "link" &&
        props.layout !== "search" &&
        props.layout !== "notfound" &&
        !props.meta?.noIndex,
    },
    icons: {
      shortcut: `${props.site.assetsBaseUrl ?? ""}${props.site.favicon || "/favicon.ico"}`,
    },
    twitter: {
      card: "summary_large_image" as const,
    },
  }

  if (metadata.description === undefined && props.layout === "article") {
    metadata.description = props.page.articlePageHeader.summary
  } else if (
    metadata.description === undefined &&
    (props.layout === "content" ||
      props.layout === "database" ||
      props.layout === "index")
  ) {
    metadata.description = props.page.contentPageHeader.summary
  } else if (
    metadata.description === undefined &&
    props.layout === "collection"
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
    .filter((item) => item.layout !== "file" && item.layout !== "link")
    .map(({ permalink, lastModified }) => ({
      url: siteUrl !== undefined ? `${siteUrl}${permalink}` : permalink,
      lastModified,
    }))
}
