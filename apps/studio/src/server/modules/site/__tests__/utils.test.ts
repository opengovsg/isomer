import { describe, expect, it } from "vitest"

import {
  getNotificationFromSiteConfig,
  getSafeSiteConfig,
  hasSearchSgConfig,
  isRecord,
} from "../utils"

describe("site utils", () => {
  describe("isRecord", () => {
    it("returns false for null and non-object values", () => {
      expect(isRecord(null)).toBe(false)
      expect(isRecord(undefined)).toBe(false)
      expect(isRecord("config")).toBe(false)
      expect(isRecord(123)).toBe(false)
      expect(isRecord(true)).toBe(false)
      expect(isRecord(["array"])).toBe(false)
    })

    it("returns true for plain object values", () => {
      expect(isRecord({})).toBe(true)
      expect(isRecord({ key: "value" })).toBe(true)
    })
  })

  describe("getSafeSiteConfig", () => {
    it("returns null for non-object values", () => {
      expect(getSafeSiteConfig(null)).toBeNull()
      expect(getSafeSiteConfig(undefined)).toBeNull()
      expect(getSafeSiteConfig("config")).toBeNull()
      expect(getSafeSiteConfig(5)).toBeNull()
      expect(getSafeSiteConfig(["array"])).toBeNull()
    })

    it("returns the object for valid site config objects", () => {
      const config = { siteName: "Agency", logoUrl: "/logo.svg" }

      expect(getSafeSiteConfig(config)).toEqual(config)
    })
  })

  describe("hasSearchSgConfig", () => {
    it("returns false for null or non-searchSG configs", () => {
      expect(hasSearchSgConfig(null)).toBe(false)
      expect(hasSearchSgConfig({})).toBe(false)
      expect(
        hasSearchSgConfig({
          search: { type: "localSearch", searchUrl: "https://example.com" },
          url: "https://example.com",
        }),
      ).toBe(false)
      expect(
        hasSearchSgConfig({
          search: { type: "searchSG", clientId: "cid" },
          url: "https://example.com",
          // unknown runtime payload: `clientId` has wrong type
        } as unknown as Parameters<typeof hasSearchSgConfig>[0]),
      ).toBe(false)
      expect(
        hasSearchSgConfig({
          search: { type: "searchSG", clientId: "cid" },
          url: "https://example.com",
          // unknown runtime payload: `url` has wrong type
        } as unknown as Parameters<typeof hasSearchSgConfig>[0]),
      ).toBe(false)
    })

    it("returns true for valid searchSG config", () => {
      expect(
        hasSearchSgConfig({
          search: { type: "searchSG", clientId: "cid" },
          url: "https://example.com",
        }),
      ).toBe(true)
    })
  })

  describe("getNotificationFromSiteConfig", () => {
    it("returns empty notification object for invalid site config", () => {
      expect(getNotificationFromSiteConfig(null)).toEqual({})
      expect(getNotificationFromSiteConfig("config")).toEqual({})
      expect(getNotificationFromSiteConfig([])).toEqual({})
      expect(getNotificationFromSiteConfig({})).toEqual({})
      expect(getNotificationFromSiteConfig({ notification: null })).toEqual({})
    })

    it("returns notification payload when present on config", () => {
      const notification = {
        title: "Banner title",
        content: {
          type: "prose",
          content: [],
        },
      }

      expect(getNotificationFromSiteConfig({ notification })).toEqual({
        notification,
      })
    })
  })
})
