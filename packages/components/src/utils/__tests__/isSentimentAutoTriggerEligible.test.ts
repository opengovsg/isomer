import { describe, expect, it } from "vitest"

import { isSentimentAutoTriggerEligible } from "../isSentimentAutoTriggerEligible"

const ISOMER_SITE_URL = "https://www.isomer.gov.sg"

const FOOTER_PAGE_HREFS = [
  "/privacy",
  "/terms-of-use/",
  "/contact-us",
  "https://form.gov.sg/abc123",
]

describe("isSentimentAutoTriggerEligible", () => {
  describe("rollout gate", () => {
    it.each(["https://www.isomer.gov.sg", "https://isomer.gov.sg/"])(
      "returns true for the Isomer site (%s)",
      (siteUrl) => {
        // Arrange / Act
        const result = isSentimentAutoTriggerEligible({
          siteUrl,
          layout: "content",
          permalink: "/about",
          footerPageHrefs: FOOTER_PAGE_HREFS,
        })

        // Assert
        expect(result).toBe(true)
      },
    )

    it.each([
      "https://www.tech.gov.sg",
      "https://notisomer.gov.sg",
      "",
      "not a url",
    ])("returns false for other sites (%s)", (siteUrl) => {
      // Arrange / Act
      const result = isSentimentAutoTriggerEligible({
        siteUrl,
        layout: "content",
        permalink: "/about",
        footerPageHrefs: FOOTER_PAGE_HREFS,
      })

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("page layouts", () => {
    it.each(["content", "article"] as const)(
      "returns true for %s pages",
      (layout) => {
        // Arrange / Act
        const result = isSentimentAutoTriggerEligible({
          siteUrl: ISOMER_SITE_URL,
          layout,
          permalink: "/news/some-article",
          footerPageHrefs: FOOTER_PAGE_HREFS,
        })

        // Assert
        expect(result).toBe(true)
      },
    )

    it.each([
      "homepage",
      "index",
      "collection",
      "database",
      "search",
      "notfound",
    ] as const)("returns false for %s pages", (layout) => {
      // Arrange / Act
      const result = isSentimentAutoTriggerEligible({
        siteUrl: ISOMER_SITE_URL,
        layout,
        permalink: "/some-page",
        footerPageHrefs: FOOTER_PAGE_HREFS,
      })

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("footer pages", () => {
    it.each(["/privacy", "/privacy/", "/terms-of-use", "/contact-us"])(
      "returns false when the content page is a footer page (%s)",
      (permalink) => {
        // Arrange / Act
        const result = isSentimentAutoTriggerEligible({
          siteUrl: ISOMER_SITE_URL,
          layout: "content",
          permalink,
          footerPageHrefs: FOOTER_PAGE_HREFS,
        })

        // Assert
        expect(result).toBe(false)
      },
    )

    it("ignores footer links with query strings or hashes", () => {
      // Arrange / Act
      const result = isSentimentAutoTriggerEligible({
        siteUrl: ISOMER_SITE_URL,
        layout: "content",
        permalink: "/contact-us",
        footerPageHrefs: ["/contact-us?ref=footer#form"],
      })

      // Assert
      expect(result).toBe(false)
    })

    it("does not match external footer links against the page path", () => {
      // Arrange / Act
      const result = isSentimentAutoTriggerEligible({
        siteUrl: ISOMER_SITE_URL,
        layout: "content",
        permalink: "/abc123",
        footerPageHrefs: ["https://form.gov.sg/abc123", undefined],
      })

      // Assert
      expect(result).toBe(true)
    })
  })
})
