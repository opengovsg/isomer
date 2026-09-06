/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-assertion, eslint/sort-keys -- test fixtures use partial mock page shapes */
import type { IsomerComponent } from "~/types"
import type { IsomerPageSchemaType } from "~/types/schema"
import type { IsomerSitemap } from "~/types/sitemap"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"

import { getMetadata, getPageJsonLd, getSiteJsonLd } from "../metadata"

const baseSite = generateSiteConfig({
  logoUrl: "/logo.svg",
  siteName: "Ministry of Foreign Affairs",
  url: "https://www.mfa.gov.sg",
})

const basePage = {
  permalink: "/",
  title: "Home",
}

describe("getMetadata", () => {
  describe("Homepage", () => {
    it("uses the hero subtitle as the meta description when present", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for homepage layout
      const props = {
        content: [{ type: "hero", subtitle: "Welcome to our site" }],
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        page: basePage,
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Welcome to our site")
    })

    it("falls back to the site name when the hero subtitle is empty", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for homepage layout
      const props = {
        content: [{ type: "hero", subtitle: "" }],
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        page: basePage,
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe(baseSite.siteName)
    })

    it("falls back to the site name when there is no hero block", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for homepage layout
      const props = {
        content: [] as IsomerComponent[],
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        page: basePage,
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe(baseSite.siteName)
    })

    it("uses the overridden meta description when set", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for homepage layout
      const props = {
        content: [{ type: "hero", subtitle: "Welcome to our site" }],
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        meta: { description: "Custom description" },
        page: basePage,
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Custom description")
    })
  })

  describe("Content", () => {
    it("uses the page summary as the meta description", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for content layout
      const props = {
        content: [] as IsomerComponent[],
        layout: ISOMER_PAGE_LAYOUTS.Content,
        page: { ...basePage, contentPageHeader: { summary: "Page summary" } },
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Page summary")
    })

    it("uses the overridden meta description when set", () => {
      // Arrange
      // SAFETY: test fixture contains the fields getMetadata reads for content layout
      const props = {
        content: [] as IsomerComponent[],
        layout: ISOMER_PAGE_LAYOUTS.Content,
        meta: { description: "Custom description" },
        page: { ...basePage, contentPageHeader: { summary: "Page summary" } },
        site: baseSite,
      } as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Custom description")
    })
  })
})

const getSerializedJsonLd = (
  input: Parameters<typeof getSiteJsonLd>[0],
): ReturnType<typeof getSiteJsonLd> => 
  // SAFETY: JSON round-trip preserves the JSON-LD object shape for assertions
  structuredClone(getSiteJsonLd(input))


describe("getSiteJsonLd", () => {
  it("generates linked website and organisation entities from configured values", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {
        contactUsLink: "/contact-us",
        socialMediaLinks: [
          {
            type: "linkedin",
            url: "https://www.linkedin.com/company/example-ministry",
          },
          {
            type: "instagram",
            url: "https://www.instagram.com/exampleministry",
          },
        ],
      },
      site: {
        agencyName: "Example Ministry",
        assetsBaseUrl: "https://assets.example.gov.sg/",
        isGovernment: true,
        logoUrl: "/images/logo.svg",
        siteEntity: {
          address: {
            addressCountry: "SG",
            addressLocality: "Singapore",
            postalCode: "123456",
            streetAddress: "1 Example Street",
          },
          contactPoint: {
            contactType: "Customer service",
            email: "hello@example.gov.sg",
            telephone: "+65 6123 4567",
          },
          description: "  We serve the public.  ",
          type: "GovernmentOrganization",
        },
        siteName: "Public Service Portal",
        url: "https://example.gov.sg",
      },
    })

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@id": "https://example.gov.sg/#website",
          "@type": "WebSite",
          name: "Public Service Portal",
          publisher: {
            "@id": "https://example.gov.sg/#organization",
          },
          url: "https://example.gov.sg/",
        },
        {
          "@id": "https://example.gov.sg/#organization",
          "@type": "GovernmentOrganization",
          address: {
            "@type": "PostalAddress",
            addressCountry: "SG",
            addressLocality: "Singapore",
            postalCode: "123456",
            streetAddress: "1 Example Street",
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer service",
            email: "hello@example.gov.sg",
            telephone: "+65 6123 4567",
            url: "https://example.gov.sg/contact-us",
          },
          description: "We serve the public.",
          logo: "https://assets.example.gov.sg/images/logo.svg",
          name: "Example Ministry",
          sameAs: [
            "https://www.linkedin.com/company/example-ministry",
            "https://www.instagram.com/exampleministry",
          ],
          url: "https://example.gov.sg/",
        },
      ],
    })
  })

  it("prepends the assets base URL to internal file links", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {
        contactUsLink: "/1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/contact-us.pdf",
        socialMediaLinks: [
          {
            type: "facebook",
            url: "/1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/poster.png",
          },
        ],
      },
      site: {
        assetsBaseUrl: "https://assets.example.com/",
        isGovernment: false,
        siteName: "Community Site",
        url: "https://community.example.com",
      },
    })

    expect(jsonLd["@graph"][1]).toMatchObject({
      contactPoint: {
        "@type": "ContactPoint",
        url: "https://assets.example.com/1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/contact-us.pdf",
      },
      sameAs: [
        "https://assets.example.com/1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/poster.png",
      ],
    })
  })

  it("resolves a resource contact link using the sitemap", () => {
    const sitemap: IsomerSitemap = {
      children: [
        {
          id: "2",
          title: "Contact us",
          summary: "",
          lastModified: "",
          permalink: "/contact-us",
          layout: "content",
        },
      ],
      id: "1",
      lastModified: "",
      layout: "homepage",
      permalink: "/",
      summary: "",
      title: "Home",
    }
    const jsonLd = getSerializedJsonLd({
      footer: {
        contactUsLink: "[resource:1:2]",
      },
      site: {
        isGovernment: false,
        siteName: "Community Site",
        url: "https://community.example.com",
      },
      sitemap,
    })

    expect(jsonLd["@graph"][1]).toMatchObject({
      contactPoint: {
        "@type": "ContactPoint",
        url: "https://community.example.com/contact-us",
      },
    })
  })

  it("uses existing site settings as fallbacks and omits empty metadata", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {
        contactUsLink: "[resource:1:999]",
        socialMediaLinks: [],
      },
      site: {
        isGovernment: false,
        logoUrl: "",
        siteName: "Community Site",
        url: "https://community.example.com",
      },
    })

    expect(jsonLd["@graph"][1]).toEqual({
      "@id": "https://community.example.com/#organization",
      "@type": "Organization",
      name: "Community Site",
      url: "https://community.example.com/",
    })
  })

  it("defaults to Organization when the government flag is absent", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {},
      site: {
        siteName: "Community Site",
        url: "https://community.example.com",
      },
    })

    expect(jsonLd["@graph"][1]?.["@type"]).toBe("Organization")
  })

  it("uses the selected organisation subtype", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {},
      site: {
        isGovernment: true,
        logoUrl: "/logo.png",
        siteEntity: {
          type: "EducationalOrganization",
        },
        siteName: "Example School",
        url: "https://school.edu.sg",
      },
    })

    expect(jsonLd["@graph"][1]?.["@type"]).toBe("EducationalOrganization")
  })

  it("does not prepend the asset base URL to an absolute logo URL", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {},
      site: {
        assetsBaseUrl: "https://assets.example.com",
        isGovernment: true,
        logoUrl: "https://logos.example.com/school.png",
        siteName: "Example School",
        url: "https://school.edu.sg",
      },
    })

    expect(jsonLd["@graph"][1]).toMatchObject({
      logo: "https://logos.example.com/school.png",
    })
  })

  it("omits a missing logo when an asset base URL is configured", () => {
    const jsonLd = getSerializedJsonLd({
      footer: {},
      site: {
        assetsBaseUrl: "https://assets.example.com",
        isGovernment: true,
        siteName: "Example School",
        url: "https://school.edu.sg",
      },
    })

    expect(jsonLd["@graph"][1]).not.toHaveProperty("logo")
  })
})

const getSerializedPageJsonLd = (
  input: Parameters<typeof getPageJsonLd>[0],
): ReturnType<typeof getPageJsonLd> => 
  // SAFETY: JSON round-trip preserves the JSON-LD object shape for assertions
  structuredClone(getPageJsonLd(input))


describe("getPageJsonLd", () => {
  const contentPage = {
    content: [],
    layout: "content",
    meta: {},
    page: {
      contentPageHeader: {
        showThumbnail: false,
        summary: "Learn about our work.",
      },
      lastModified: "2026-08-18T10:00:00.000Z",
      permalink: "/about-us",
      title: "About us",
    },
    site: generateSiteConfig({
      url: "https://example.gov.sg",
    }),
  } satisfies IsomerPageSchemaType

  it("generates a page entity linked to the site-wide graph", () => {
    expect(getSerializedPageJsonLd(contentPage)).toEqual({
      "@context": "https://schema.org",
      "@id": "https://example.gov.sg/about-us#webpage",
      "@type": "WebPage",
      dateModified: "2026-08-18T10:00:00.000Z",
      description: "Learn about our work.",
      inLanguage: "en",
      isPartOf: {
        "@id": "https://example.gov.sg/#website",
      },
      name: "About us",
      publisher: {
        "@id": "https://example.gov.sg/#organization",
      },
      url: "https://example.gov.sg/about-us",
    })
  })

  it("uses the explicitly configured meta description", () => {
    expect(
      getSerializedPageJsonLd({
        ...contentPage,
        meta: {
          description: "The canonical description.",
        },
      }).description,
    ).toBe("The canonical description.")
  })

  it("uses the default site URL when the configured URL is empty", () => {
    const jsonLd = getSerializedPageJsonLd({
      ...contentPage,
      site: {
        siteName: "Example Agency",
        url: "",
      },
    })

    expect(jsonLd.url).toBe("https://www.isomer.gov.sg/about-us")
    expect(jsonLd["@id"]).toBe("https://www.isomer.gov.sg/about-us#webpage")
    expect(jsonLd.isPartOf["@id"]).toBe("https://www.isomer.gov.sg/#website")
  })
})
