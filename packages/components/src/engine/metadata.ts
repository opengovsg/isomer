import type { DistributedOmit } from "type-fest"
import type { IsomerPageSchemaType } from "~/types/schema"
import type { IsomerSiteConfigProps } from "~/types/site"
import type { IsomerSitemap } from "~/types/sitemap"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

const DEFAULT_SITE_NAME = "Isomer"
const DEFAULT_SITE_URL = "https://www.isomer.gov.sg"
const TRAILING_SLASH_REGEX = /\/$/u

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
  sitemap?: IsomerSitemap
}

type PageSchemaWithoutSite = DistributedOmit<IsomerPageSchemaType, "site">

type GetPageJsonLdProps = PageSchemaWithoutSite & {
  // NOTE: `siteName` is the homepage's meta-description fallback, so it is
  // needed wherever that description is derived.
  site: Pick<IsomerSiteConfigProps, "siteName" | "url">
}

const getNonEmptyString = (value?: string) => {
  const trimmedValue = value?.trim()
  return trimmedValue !== undefined && trimmedValue !== ""
    ? trimmedValue
    : undefined
}

const hasDefinedValue = (values: (string | undefined)[]) =>
  values.some((value) => value !== undefined)

const getAbsoluteHttpUrl = (
  value: string | undefined,
  siteUrl: string,
  assetsBaseUrl?: string,
  sitemapArray: IsomerSitemap[] = [],
): string | undefined => {
  const resolvedValue = getReferenceLinkHref(
    value,
    sitemapArray,
    assetsBaseUrl?.replace(TRAILING_SLASH_REGEX, ""),
  )

  if (
    resolvedValue === undefined ||
    resolvedValue === "" ||
    resolvedValue.startsWith("[resource:")
  ) {
    return undefined
  }

  try {
    const url = new URL(resolvedValue, siteUrl)
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

const buildLogoUrl = (
  site: GetSiteJsonLdProps["site"],
): IsomerSiteConfigProps["logoUrl"] => {
  if (
    site.assetsBaseUrl !== undefined &&
    site.assetsBaseUrl !== "" &&
    site.logoUrl?.startsWith("/") === true
  ) {
    return `${site.assetsBaseUrl.replace(TRAILING_SLASH_REGEX, "")}${site.logoUrl}`
  }

  return site.logoUrl ?? ""
}

const buildSameAsLinks = (
  footer: GetSiteJsonLdProps["footer"],
  siteUrl: string,
  assetsBaseUrl?: string,
  sitemapArray: IsomerSitemap[] = [],
) =>
  footer.socialMediaLinks
    ?.map(({ url }) =>
      getAbsoluteHttpUrl(url, siteUrl, assetsBaseUrl, sitemapArray),
    )
    .filter((url): url is string => url !== undefined)

const getOrganisationType = (
  site: GetSiteJsonLdProps["site"],
  entity: GetSiteJsonLdProps["site"]["siteEntity"],
) =>
  entity?.type ??
  (site.isGovernment === true
    ? ("GovernmentOrganization" as const)
    : ("Organization" as const))

const buildPostalAddress = (
  entity: GetSiteJsonLdProps["site"]["siteEntity"],
) => {
  const addressValues = {
    addressCountry: getNonEmptyString(entity?.address?.addressCountry),
    addressLocality: getNonEmptyString(entity?.address?.addressLocality),
    postalCode: getNonEmptyString(entity?.address?.postalCode),
    streetAddress: getNonEmptyString(entity?.address?.streetAddress),
  }

  return hasDefinedValue(Object.values(addressValues))
    ? {
        "@type": "PostalAddress" as const,
        ...addressValues,
      }
    : undefined
}

const buildContactPoint = ({
  entity,
  footer,
  site,
  siteUrl,
  sitemapArray,
}: {
  entity: GetSiteJsonLdProps["site"]["siteEntity"]
  footer: GetSiteJsonLdProps["footer"]
  site: GetSiteJsonLdProps["site"]
  siteUrl: string
  sitemapArray: IsomerSitemap[]
}) => {
  const contactPointValues = {
    contactType: getNonEmptyString(entity?.contactPoint?.contactType),
    email: getNonEmptyString(entity?.contactPoint?.email),
    telephone: getNonEmptyString(entity?.contactPoint?.telephone),
    url: getAbsoluteHttpUrl(
      footer.contactUsLink,
      siteUrl,
      site.assetsBaseUrl,
      sitemapArray,
    ),
  }

  return hasDefinedValue(Object.values(contactPointValues))
    ? {
        "@type": "ContactPoint" as const,
        ...contactPointValues,
      }
    : undefined
}

const buildOrganisation = ({
  site,
  footer,
  organisationId,
  siteUrl,
  siteName,
  sitemapArray,
}: {
  site: GetSiteJsonLdProps["site"]
  footer: GetSiteJsonLdProps["footer"]
  organisationId: string
  siteUrl: string
  siteName: string
  sitemapArray: IsomerSitemap[]
}) => {
  const entity = site.siteEntity
  const organisationName = getNonEmptyString(site.agencyName) ?? siteName
  const logo = getAbsoluteHttpUrl(buildLogoUrl(site), siteUrl)
  const sameAs = buildSameAsLinks(
    footer,
    siteUrl,
    site.assetsBaseUrl,
    sitemapArray,
  )

  return {
    "@id": organisationId,
    "@type": getOrganisationType(site, entity),
    address: buildPostalAddress(entity),
    contactPoint: buildContactPoint({
      entity,
      footer,
      site,
      siteUrl,
      sitemapArray,
    }),
    description: getNonEmptyString(entity?.description),
    ...(logo !== undefined ? { logo } : {}),
    name: organisationName,
    sameAs: sameAs !== undefined && sameAs.length > 0 ? sameAs : undefined,
    url: siteUrl,
  }
}

/**
 * Generates the site-wide Schema.org entity graph rendered by the base
 * template. The WebSite node represents the website itself, while the linked
 * Organization node represents the agency or organisation that publishes it.
 */
export const getSiteJsonLd = ({
  site,
  footer,
  sitemap,
}: GetSiteJsonLdProps) => {
  const siteUrl = getSiteUrl(site.url)
  const sitemapArray = sitemap === undefined ? [] : getSitemapAsArray(sitemap)
  const websiteId = new URL("#website", siteUrl).toString()
  const organisationId = new URL("#organization", siteUrl).toString()
  const siteName = getNonEmptyString(site.siteName) ?? DEFAULT_SITE_NAME

  const organisation = buildOrganisation({
    footer,
    organisationId,
    site,
    siteName,
    siteUrl,
    sitemapArray,
  })

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": websiteId,
        "@type": "WebSite",
        name: siteName,
        publisher: {
          "@id": organisationId,
        },
        url: siteUrl,
      },
      organisation,
    ],
  }
}

const getOpenGraphTitle = (props: IsomerPageSchemaType) =>
  // NOTE: We show the site name as the title for the homepage, as places like
  // WhatsApp do not use the site_name property of the OpenGraph metadata when
  // displaying the page preview, which can be confusing for users
  props.page.permalink === "/" ? props.site.siteName : props.page.title

const getMetaDescription = (props: GetPageJsonLdProps): string | undefined => {
  const metaDescription = props.meta?.description
  if (metaDescription !== undefined && metaDescription !== "") {
    return metaDescription
  }

  switch (props.layout) {
    case ISOMER_PAGE_LAYOUTS.Article: {
      return props.page.articlePageHeader.summary
    }
    case ISOMER_PAGE_LAYOUTS.Content:
    case ISOMER_PAGE_LAYOUTS.Database:
    case ISOMER_PAGE_LAYOUTS.Index: {
      return props.page.contentPageHeader.summary
    }
    case ISOMER_PAGE_LAYOUTS.Collection: {
      return props.page.subtitle
    }
    case ISOMER_PAGE_LAYOUTS.Homepage: {
      const heroSubtitle = props.content.find(
        (item) => item.type === "hero",
      )?.subtitle
      return heroSubtitle !== undefined && heroSubtitle !== ""
        ? heroSubtitle
        : props.site.siteName
    }
    case ISOMER_PAGE_LAYOUTS.File:
    case ISOMER_PAGE_LAYOUTS.Link:
    case ISOMER_PAGE_LAYOUTS.Search:
    case ISOMER_PAGE_LAYOUTS.NotFound: {
      // NOTE: These pages do not appear in search results, so we don't need to
      // provide a meta description
      return undefined
    }
    default: {
      const _: never = props
      return undefined
    }
  }
}

const getMetaImage = (props: IsomerPageSchemaType): string | undefined => {
  switch (props.layout) {
    case ISOMER_PAGE_LAYOUTS.Article: {
      const metaImage = props.meta?.image
      if (metaImage !== undefined && metaImage !== "") {
        return metaImage
      }
      return props.page.image?.src
    }
    case ISOMER_PAGE_LAYOUTS.Content:
    case ISOMER_PAGE_LAYOUTS.Database:
    case ISOMER_PAGE_LAYOUTS.Index:
    case ISOMER_PAGE_LAYOUTS.Collection: {
      return props.meta?.image
    }
    case ISOMER_PAGE_LAYOUTS.Homepage: {
      const metaImage = props.meta?.image
      if (metaImage !== undefined && metaImage !== "") {
        return metaImage
      }
      return props.content.find((item) => item.type === "hero")?.backgroundUrl
    }
    case ISOMER_PAGE_LAYOUTS.File:
    case ISOMER_PAGE_LAYOUTS.Link:
    case ISOMER_PAGE_LAYOUTS.Search:
    case ISOMER_PAGE_LAYOUTS.NotFound: {
      // NOTE: These pages do not appear in search results, so we don't need to
      // provide a meta description
      return undefined
    }
    default: {
      const _: never = props
      return undefined
    }
  }
}

// NOTE: We throw an error for malformed site URLs to ensure data integrity.
// The schema serves as our contract - when inputs don't match expectations,
// we should fail fast rather than accommodate inconsistent data formats.
const getCanonicalUrl = (props: GetPageJsonLdProps) => {
  if (props.site.url === undefined || props.site.url === "") {
    return props.page.permalink
  }

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
    "@id": new URL("#webpage", pageUrl).toString(),
    "@type": "WebPage",
    dateModified: props.page.lastModified,
    description: getMetaDescription(props),
    inLanguage: "en",
    isPartOf: {
      "@id": new URL("#website", siteUrl).toString(),
    },
    name: props.page.title,
    publisher: {
      "@id": new URL("#organization", siteUrl).toString(),
    },
    url: pageUrl,
  }
}

export const getMetadata = (props: IsomerPageSchemaType) => {
  const favicon =
    props.site.favicon !== undefined && props.site.favicon !== ""
      ? props.site.favicon
      : "/favicon.ico"
  const faviconUrl = `${props.site.assetsBaseUrl ?? ""}${favicon}`
  const canonicalUrl = getCanonicalUrl(props)
  const metaImage = getMetaImage(props)
  const metaImageUrl = `${props.site.assetsBaseUrl ?? ""}${metaImage ?? props.site.logoUrl}`

  const metadata = {
    alternates: {
      canonical: canonicalUrl,
    },
    description: getMetaDescription(props),
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
    },
    metadataBase:
      props.site.url !== undefined && props.site.url !== ""
        ? new URL(props.site.url)
        : undefined,
    openGraph: {
      description: getMetaDescription(props),
      images:
        metaImageUrl !== undefined && metaImageUrl !== ""
          ? [
              {
                url: metaImageUrl,
              },
            ]
          : undefined,
      siteName: props.site.siteName,
      title: getOpenGraphTitle(props),
      type:
        props.layout === ISOMER_PAGE_LAYOUTS.Article ? "article" : "website",
      url: canonicalUrl,
    },
    robots: {
      index:
        props.layout !== ISOMER_PAGE_LAYOUTS.File &&
        props.layout !== ISOMER_PAGE_LAYOUTS.Link &&
        props.layout !== ISOMER_PAGE_LAYOUTS.Search &&
        props.layout !== ISOMER_PAGE_LAYOUTS.NotFound &&
        props.meta?.noIndex !== true,
    },
    // NOTE: The title will be used like "{title} | {siteName}" inside the
    // NextJS template
    title: props.page.title,
    twitter: {
      card: "summary_large_image" as const,
    },
  }

  return metadata
}

export const shouldBlockIndexing = (
  environment: IsomerPageSchemaType["site"]["environment"],
): boolean => environment !== "production"

export const getRobotsTxt = (props: IsomerPageSchemaType) => {
  const rules = [
    {
      allow: "/",
      disallow: ["/search"],
      userAgent: "*",
    },
  ]

  return {
    rules: shouldBlockIndexing(props.site.environment)
      ? [
          {
            disallow: "/",
            userAgent: "*",
          },
          {
            allow: "/",
            userAgent: "SearchSG",
          },
        ]
      : rules,
    sitemap:
      props.site.url !== undefined && props.site.url !== ""
        ? `${props.site.url}/sitemap.xml`
        : undefined,
  }
}

export const getSitemapXml = (sitemap: IsomerSitemap, siteUrl?: string) => {
  const sitemapEntries = []

  for (const item of getSitemapAsArray(sitemap)) {
    if (
      item.layout === ISOMER_PAGE_LAYOUTS.File ||
      item.layout === ISOMER_PAGE_LAYOUTS.Link
    ) {
      continue
    }

    const { permalink, lastModified } = item
    const permalinkWithTrailingSlash = permalink.endsWith("/")
      ? permalink
      : `${permalink}/`

    sitemapEntries.push({
      lastModified,
      url:
        siteUrl === undefined
          ? permalinkWithTrailingSlash
          : `${siteUrl}${permalinkWithTrailingSlash}`,
    })
  }

  return sitemapEntries
}
