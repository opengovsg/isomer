import { describe, expect, it } from "vitest"

import { getMetadata } from "~/engine/metadata"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import type { IsomerPageSchemaType } from "~/types"

const SITE_NAME = "Embassy of Singapore in Berlin"
const site = generateSiteConfig({
  siteName: SITE_NAME,
  url: "https://berlin.mfa.gov.sg",
})

const createHomepageProps = ({
  metaDescription,
}: {
  metaDescription?: string
} = {}): IsomerPageSchemaType =>
  ({
    layout: "homepage",
    version: "0.1.0",
    site,
    page: {
      title: "Home",
      permalink: "/",
      lastModified: "",
    },
    meta: metaDescription ? { description: metaDescription } : undefined,
    content: [
      {
        type: "hero",
        subtitle: "Hero subtitle should not be used as meta description",
      },
    ],
  }) as IsomerPageSchemaType

const createContentProps = ({
  summary = "Default content summary",
  metaDescription,
}: {
  summary?: string
  metaDescription?: string
} = {}): IsomerPageSchemaType =>
  ({
    layout: "content",
    version: "0.1.0",
    site,
    page: {
      title: "About",
      permalink: "/about",
      lastModified: "",
      contentPageHeader: {
        summary,
        showThumbnail: false,
      },
    },
    meta: metaDescription ? { description: metaDescription } : undefined,
    content: [],
  }) as IsomerPageSchemaType

describe("getMetadata", () => {
  it("uses site name as homepage description even when hero or meta description exists", () => {
    const metadata = getMetadata(
      createHomepageProps({ metaDescription: "Custom homepage meta description" }),
    )

    expect(metadata.description).toBe(SITE_NAME)
    expect(metadata.openGraph.description).toBe(SITE_NAME)
  })

  it("uses custom meta description for non-homepages when provided", () => {
    const metadata = getMetadata(
      createContentProps({ metaDescription: "Custom content meta description" }),
    )

    expect(metadata.description).toBe("Custom content meta description")
    expect(metadata.openGraph.description).toBe("Custom content meta description")
  })

  it("defaults to page summary for non-homepages", () => {
    const metadata = getMetadata(createContentProps())

    expect(metadata.description).toBe("Default content summary")
    expect(metadata.openGraph.description).toBe("Default content summary")
  })

  it("falls back to site name when non-homepage summary is empty", () => {
    const metadata = getMetadata(createContentProps({ summary: "" }))

    expect(metadata.description).toBe(SITE_NAME)
    expect(metadata.openGraph.description).toBe(SITE_NAME)
  })
})
