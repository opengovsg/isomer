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
        !props.meta?.noIndex,
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

  if (metadata.description === undefined && props.layout === "article") {
    return {
      ...metadata,
      description: props.page.articlePageHeader.summary.join(" "),
    }
  } else if (metadata.description === undefined && props.layout === "content") {
    return {
      ...metadata,
      description: props.page.contentPageHeader.summary,
    }
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

export const getSitemapXml = (sitemap: IsomerSitemap) => {
  return getSitemapAsArray(sitemap)
    .filter((item) => item.layout !== "file" && item.layout !== "link")
    .map(({ permalink, lastModified }) => ({
      url: permalink,
      lastModified,
    }))
}
