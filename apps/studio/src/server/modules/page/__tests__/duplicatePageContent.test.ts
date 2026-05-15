import { describe, expect, it } from "vitest"

import {
  buildNewAssetFileKeyForSite,
  collectUniqueAssetFileKeys,
  rewriteAssetFileKeysInValue,
  tryParseSiteAssetFileKey,
} from "../helpers/duplicatePageContent"

describe("duplicatePageContent", () => {
  describe("tryParseSiteAssetFileKey", () => {
    it("parses leading-slash path", () => {
      // Arrange
      const path = "/25/550e8400-e29b-41d4-a716-446655440000/photo.png"
      const siteId = 25

      // Act
      const parsed = tryParseSiteAssetFileKey(path, siteId)

      // Assert
      expect(parsed).toBe("25/550e8400-e29b-41d4-a716-446655440000/photo.png")
    })

    it("parses path without leading slash", () => {
      // Arrange
      const path = "25/550e8400-e29b-41d4-a716-446655440000/photo.png"
      const siteId = 25

      // Act
      const parsed = tryParseSiteAssetFileKey(path, siteId)

      // Assert
      expect(parsed).toBe("25/550e8400-e29b-41d4-a716-446655440000/photo.png")
    })

    it("returns null for wrong site", () => {
      // Arrange
      const path = "/99/550e8400-e29b-41d4-a716-446655440000/photo.png"
      const siteId = 25

      // Act
      const parsed = tryParseSiteAssetFileKey(path, siteId)

      // Assert
      expect(parsed).toBeNull()
    })

    it("returns null for external URL", () => {
      // Arrange
      const path = "https://x.com/a.png"
      const siteId = 25

      // Act
      const parsed = tryParseSiteAssetFileKey(path, siteId)

      // Assert
      expect(parsed).toBeNull()
    })

    it("returns null for placeholder", () => {
      // Arrange
      const path = "/placeholder_no_image.png"
      const siteId = 25

      // Act
      const parsed = tryParseSiteAssetFileKey(path, siteId)

      // Assert
      expect(parsed).toBeNull()
    })
  })

  describe("collectUniqueAssetFileKeys", () => {
    it("dedupes nested occurrences", () => {
      // Arrange
      const siteId = 3
      const key = `${siteId}/550e8400-e29b-41d4-a716-446655440000/a.pdf`
      const content = {
        blocks: [
          { src: `/${key}` },
          { href: key },
          { nested: { x: `/${key}` } },
        ],
      }

      // Act
      const keys = collectUniqueAssetFileKeys(content, siteId)

      // Assert
      expect(keys).toEqual([key])
    })
  })

  describe("rewriteAssetFileKeysInValue", () => {
    it("rewrites whole strings and embedded substrings", () => {
      // Arrange
      const siteId = 3
      const oldKey = `${siteId}/550e8400-e29b-41d4-a716-446655440000/doc.pdf`
      const newKey = `${siteId}/660e8400-e29b-41d4-a716-446655440001/doc.pdf`
      const map = new Map([[oldKey, newKey]])
      const content = {
        a: `/${oldKey}`,
        b: `<img src="/${oldKey}" />`,
        c: "leave-me",
      }

      // Act
      rewriteAssetFileKeysInValue(content, siteId, map)

      // Assert
      expect(content).toEqual({
        a: `/${newKey}`,
        b: `<img src="/${newKey}" />`,
        c: "leave-me",
      })
    })
  })

  describe("buildNewAssetFileKeyForSite", () => {
    it("builds a new key with fresh uuid folder", () => {
      // Arrange
      const siteId = 25
      const oldKey = "25/550e8400-e29b-41d4-a716-446655440000/report.pdf"

      // Act
      const result = buildNewAssetFileKeyForSite(siteId, oldKey)

      // Assert
      const match = result.match(
        /^25\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/report\.pdf$/i,
      )
      expect(match).not.toBeNull()
      expect(match![1]).not.toBe("550e8400-e29b-41d4-a716-446655440000")
    })
  })
})
