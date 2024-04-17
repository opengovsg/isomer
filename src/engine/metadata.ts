import type { IsomerPageSchema, IsomerSitemap } from "./types"

type SitemapXmlItem = {
  url: string
  lastModified?: string | Date | undefined
}

export const getMetadata = (props: IsomerPageSchema) => {
  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    description: props.page.description || undefined,
    robots: {
      index: !props.page.noIndex,
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
  let result: SitemapXmlItem[] = []

  const traverse = (node: IsomerSitemap) => {
    if (node.permalink) {
      result.push({
        url: node.permalink,
        lastModified: node.lastModified,
      })
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child))
    }
  }

  traverse(sitemap)
  return result
}
