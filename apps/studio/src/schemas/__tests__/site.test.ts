import { describe, expect, it } from "vitest"

import { createSiteSchema, updateSiteConfigSchema } from "../site"

const invalidSiteNames = ["", " ", "\t", "\n", " \t\n "]

const validUpdateSiteConfigInput = {
  siteId: 1,
  logoUrl: "/logo.svg",
  url: "https://www.example.gov.sg",
  theme: "isomer-next" as const,
}

describe("site schemas", () => {
  describe("createSiteSchema", () => {
    it.each(invalidSiteNames)(
      "rejects empty or whitespace-only siteName",
      (siteName) => {
        const result = createSiteSchema.safeParse({ siteName })

        expect(result.success).toBe(false)
      },
    )

    it("accepts siteName with non-whitespace characters", () => {
      const result = createSiteSchema.safeParse({ siteName: "My Site" })

      expect(result.success).toBe(true)
    })
  })

  describe("updateSiteConfigSchema", () => {
    it.each(invalidSiteNames)(
      "rejects empty or whitespace-only siteName",
      (siteName) => {
        const result = updateSiteConfigSchema.safeParse({
          ...validUpdateSiteConfigInput,
          siteName,
        })

        expect(result.success).toBe(false)
      },
    )

    it("accepts siteName with non-whitespace characters", () => {
      const result = updateSiteConfigSchema.safeParse({
        ...validUpdateSiteConfigInput,
        siteName: "My Site",
      })

      expect(result.success).toBe(true)
    })
  })
})
