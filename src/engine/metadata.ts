import { getSitemapAsArray } from "~/utils"
import type { IsomerPageSchema, IsomerSitemap } from "~/types"

type SitemapXmlItem = {
  url: string
  lastModified?: string | Date | undefined
}

export const getMetadata = (props: IsomerPageSchema) => {
  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    description: props.page.description || undefined,
    robots: {
      index:
        props.layout !== "file" &&
        props.layout !== "link" &&
        !props.page.noIndex,
    },
    icons: {
      shortcut:
        props.site.favicon ||
        "https://www.isomer.gov.sg/images/favicon-isomer.ico",
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

export const getRobotsTxt = (props: IsomerPageSchema) => {
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

export const getSitemapXml = (sitemap: IsomerSitemap) => {
  return getSitemapAsArray(sitemap)
    .filter((item) => item.layout !== "file" && item.layout !== "link")
    .map(
      ({ permalink, lastModified }): SitemapXmlItem => ({
        url: permalink,
        lastModified,
      }),
    )
}
