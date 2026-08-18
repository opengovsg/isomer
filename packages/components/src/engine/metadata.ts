import type { DistributedOmit } from "type-fest"
import type { IsomerPageSchemaType } from "~/types/schema"
import type { IsomerSiteConfigProps } from "~/types/site"
import type { IsomerSitemap } from "~/types/sitemap"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

const DEFAULT_SITE_NAME = "Isomer"
const DEFAULT_SITE_URL = "https://www.isomer.gov.sg"

interface GetSiteJsonLdProps {
  site: Pick<
    IsomerSiteConfigProps,
    "agencyName" | "isGovernment" | "siteEntity" | "siteName" | "url"
  > & {
    assetsBaseUrl?: string
    logoUrl?: IsomerSiteConfigProps["logoUrl"]
  }
  footer: {
    contactUsLink?: string
    socialMediaLinks?: readonly { type?: string; url: string }[]
  }
}

type PageSchemaWithoutSite = DistributedOmit<IsomerPageSchemaType, "site">

type GetPageJsonLdProps = PageSchemaWithoutSite & {
  site: Pick<IsomerSiteConfigProps, "url">
}

const getNonEmptyString = (value?: string) => {
  const trimmedValue = value?.trim()
  return trimmedValue || undefined
}

const getAbsoluteHttpUrl = (value: string | undefined, siteUrl: string) => {
  if (!value || value.startsWith("[resource:")) return undefined

  try {
    const url = new URL(value, siteUrl)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

const getSiteUrl = (configuredUrl: string) => {
  const siteUrl = getNonEmptyString(configuredUrl) ?? DEFAULT_SITE_URL
  return getAbsoluteHttpUrl(siteUrl, DEFAULT_SITE_URL) ?? DEFAULT_SITE_URL
}

/**
 * Generates the site-wide Schema.org entity graph rendered by the base
 * template. The WebSite node represents the website itself, while the linked
 * Organization node represents the agency or organisation that publishes it.
 */
export const getSiteJsonLd = ({ site, footer }: GetSiteJsonLdProps) => {
  const siteUrl = getSiteUrl(site.url)
  const websiteId = new URL("#website", siteUrl).toString()
  const organisationId = new URL("#organization", siteUrl).toString()
  const siteName = getNonEmptyString(site.siteName) ?? DEFAULT_SITE_NAME
  const organisationName = getNonEmptyString(site.agencyName) ?? siteName
  const entity = site.siteEntity
  const logoUrl =
    site.assetsBaseUrl && site.logoUrl?.startsWith("/")
      ? `${site.assetsBaseUrl.replace(/\/$/, "")}${site.logoUrl}`
      : site.logoUrl

  const addressValues = {
    streetAddress: getNonEmptyString(entity?.address?.streetAddress),
    addressLocality: getNonEmptyString(entity?.address?.addressLocality),
    postalCode: getNonEmptyString(entity?.address?.postalCode),
    addressCountry: getNonEmptyString(entity?.address?.addressCountry),
  }
  const hasAddress = Object.values(addressValues).some(Boolean)

  const contactPointValues = {
    contactType: getNonEmptyString(entity?.contactPoint?.contactType),
    telephone: getNonEmptyString(entity?.contactPoint?.telephone),
    email: getNonEmptyString(entity?.contactPoint?.email),
    url: getAbsoluteHttpUrl(footer.contactUsLink, siteUrl),
  }
  const hasContactPoint = Object.values(contactPointValues).some(Boolean)

  const sameAs = footer.socialMediaLinks
    ?.map(({ url }) => getAbsoluteHttpUrl(url, siteUrl))
    .filter((url): url is string => url !== undefined)

  const organisation = {
    "@type":
      entity?.type ??
      (site.isGovernment
        ? ("GovernmentOrganization" as const)
        : ("Organization" as const)),
    "@id": organisationId,
    name: organisationName,
    url: siteUrl,
    logo: getAbsoluteHttpUrl(logoUrl, siteUrl),
    description: getNonEmptyString(entity?.description),
    address: hasAddress
      ? {
          "@type": "PostalAddress" as const,
          ...addressValues,
        }
      : undefined,
    contactPoint: hasContactPoint
      ? {
          "@type": "ContactPoint" as const,
          ...contactPointValues,
        }
      : undefined,
    sameAs: sameAs?.length ? sameAs : undefined,
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteName,
        url: siteUrl,
        publisher: {
          "@id": organisationId,
        },
      },
      organisation,
    ],
  }
}

const getOpenGraphTitle = (props: IsomerPageSchemaType) => {
  // NOTE: We show the site name as the title for the homepage, as places like
  // WhatsApp do not use the site_name property of the OpenGraph metadata when
  // displaying the page preview, which can be confusing for users
  return props.page.permalink === "/" ? props.site.siteName : props.page.title
}

const getMetaDescription = (props: PageSchemaWithoutSite) => {
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
const getCanonicalUrl = (props: GetPageJsonLdProps) => {
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

/**
 * Generates the Schema.org entity for a rendered page. Its stable references
 * connect it to the site-wide WebSite and Organization graph.
 */
export const getPageJsonLd = (props: GetPageJsonLdProps) => {
  const canonicalUrl = getCanonicalUrl(props)
  const siteUrl = getSiteUrl(props.site.url)
  const pageUrl = new URL(canonicalUrl, siteUrl).toString()

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": new URL("#webpage", pageUrl).toString(),
    url: pageUrl,
    name: props.page.title,
    description: getMetaDescription(props),
    dateModified: props.page.lastModified,
    inLanguage: "en",
    isPartOf: {
      "@id": new URL("#website", siteUrl).toString(),
    },
    publisher: {
      "@id": new URL("#organization", siteUrl).toString(),
    },
  }
}

export const getMetadata = (props: IsomerPageSchemaType) => {
  const faviconUrl = `${props.site.assetsBaseUrl ?? ""}${props.site.favicon || "/favicon.ico"}`
  const canonicalUrl = getCanonicalUrl(props)
  const metaImage = getMetaImage(props)
  const metaImageUrl = `${props.site.assetsBaseUrl ?? ""}${metaImage ?? props.site.logoUrl}`

  const metadata = {
    metadataBase: props.site.url ? new URL(props.site.url) : undefined,
    // NOTE: The title will be used like "{title} | {siteName}" inside the
    // NextJS template
    title: props.page.title,
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
      title: getOpenGraphTitle(props),
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
      ? [
          {
            userAgent: "*",
            disallow: "/",
          },
          {
            userAgent: "SearchSG",
            allow: "/",
          },
        ]
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
    .map(({ permalink, lastModified }) => {
      const permalinkWithTrailingSlash = permalink.endsWith("/")
        ? permalink
        : `${permalink}/`

      return {
        url:
          siteUrl !== undefined
            ? `${siteUrl}${permalinkWithTrailingSlash}`
            : permalinkWithTrailingSlash,
        lastModified,
      }
    })
}
