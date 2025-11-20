import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"

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
      return props.meta?.image || props.page.image?.src
    case "content":
    case "database":
    case "index":
    case "collection":
      return props.meta?.image
    case "homepage":
      return (
        props.meta?.image ||
        props.content.find((item) => item.type === "hero")?.backgroundUrl
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
      title: getMetaTitle(props),
      description: getMetaDescription(props),
      url: canonicalUrl,
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
    alternates: {
      canonical: canonicalUrl,
    },
  }

  return metadata
}
