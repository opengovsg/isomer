import type { IsomerPageSchemaType } from "~/types/schema"
import { describe, expect, it } from "vitest"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"

import { getMetadata } from "../metadata"

const baseSite = {
  siteName: "Ministry of Foreign Affairs",
  url: "https://www.mfa.gov.sg",
  logoUrl: "/logo.svg",
} as IsomerPageSchemaType["site"]

const basePage = {
  permalink: "/",
  title: "Home",
} as IsomerPageSchemaType["page"]

describe("getMetadata", () => {
  describe("Homepage", () => {
    it("uses the hero subtitle as the meta description when present", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        site: baseSite,
        page: basePage,
        content: [{ type: "hero", subtitle: "Welcome to our site" }],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Welcome to our site")
    })

    it("falls back to the site name when the hero subtitle is empty", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        site: baseSite,
        page: basePage,
        content: [{ type: "hero", subtitle: "" }],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe(baseSite.siteName)
    })

    it("falls back to the site name when there is no hero block", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        site: baseSite,
        page: basePage,
        content: [],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe(baseSite.siteName)
    })

    it("uses the overridden meta description when set", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        site: baseSite,
        page: basePage,
        meta: { description: "Custom description" },
        content: [{ type: "hero", subtitle: "Welcome to our site" }],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Custom description")
    })
  })

  describe("Content", () => {
    it("uses the page summary as the meta description", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Content,
        site: baseSite,
        page: { ...basePage, contentPageHeader: { summary: "Page summary" } },
        content: [],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Page summary")
    })

    it("uses the overridden meta description when set", () => {
      // Arrange
      const props = {
        layout: ISOMER_PAGE_LAYOUTS.Content,
        site: baseSite,
        page: { ...basePage, contentPageHeader: { summary: "Page summary" } },
        meta: { description: "Custom description" },
        content: [],
      } as unknown as IsomerPageSchemaType

      // Act
      const actual = getMetadata(props).description

      // Assert
      expect(actual).toBe("Custom description")
    })
  })
})
