import * as crypto from "crypto"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildNewAssetFileKeyForSite,
  collectUniqueAssetFileKeys,
  rewriteAssetFileKeysInValue,
  tryParseSiteAssetFileKey,
} from "../helpers/duplicatePageContent"

describe("duplicatePageContent", () => {
  describe("tryParseSiteAssetFileKey", () => {
    it("parses leading-slash path", () => {
      expect(
        tryParseSiteAssetFileKey(
          "/25/550e8400-e29b-41d4-a716-446655440000/photo.png",
          25,
        ),
      ).toBe("25/550e8400-e29b-41d4-a716-446655440000/photo.png")
    })

    it("parses path without leading slash", () => {
      expect(
        tryParseSiteAssetFileKey(
          "25/550e8400-e29b-41d4-a716-446655440000/photo.png",
          25,
        ),
      ).toBe("25/550e8400-e29b-41d4-a716-446655440000/photo.png")
    })

    it("returns null for wrong site", () => {
      expect(
        tryParseSiteAssetFileKey(
          "/99/550e8400-e29b-41d4-a716-446655440000/photo.png",
          25,
        ),
      ).toBeNull()
    })

    it("returns null for external URL", () => {
      expect(tryParseSiteAssetFileKey("https://x.com/a.png", 25)).toBeNull()
    })

    it("returns null for placeholder", () => {
      expect(
        tryParseSiteAssetFileKey("/placeholder_no_image.png", 25),
      ).toBeNull()
    })
  })

  describe("collectUniqueAssetFileKeys", () => {
    it("dedupes nested occurrences", () => {
      const siteId = 3
      const key = `${siteId}/550e8400-e29b-41d4-a716-446655440000/a.pdf`
      const content = {
        blocks: [
          { src: `/${key}` },
          { href: key },
          { nested: { x: `/${key}` } },
        ],
      }
      expect(collectUniqueAssetFileKeys(content, siteId)).toEqual([key])
    })
  })

  describe("rewriteAssetFileKeysInValue", () => {
    it("rewrites whole strings and embedded substrings", () => {
      const siteId = 3
      const oldKey = `${siteId}/550e8400-e29b-41d4-a716-446655440000/doc.pdf`
      const newKey = `${siteId}/660e8400-e29b-41d4-a716-446655440001/doc.pdf`
      const map = new Map([[oldKey, newKey]])
      const content = {
        a: `/${oldKey}`,
        b: `<img src="/${oldKey}" />`,
        c: "leave-me",
      }
      rewriteAssetFileKeysInValue(content, siteId, map)
      expect(content).toEqual({
        a: `/${newKey}`,
        b: `<img src="/${newKey}" />`,
        c: "leave-me",
      })
    })
  })

  describe("buildNewAssetFileKeyForSite", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("builds a new key with fresh uuid folder", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      )
      expect(
        buildNewAssetFileKeyForSite(
          25,
          "25/550e8400-e29b-41d4-a716-446655440000/report.pdf",
        ),
      ).toBe("25/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/report.pdf")
    })
  })
})
