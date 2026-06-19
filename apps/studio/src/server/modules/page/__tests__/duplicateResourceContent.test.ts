import { describe, expect, it } from "vitest"

import {
  collectAssetKeys,
  rewriteAssetKeys,
} from "../helpers/duplicateResourceContent"

describe("duplicateResourceContent", () => {
  describe("collectAssetKeys", () => {
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
      const keys = collectAssetKeys(content, siteId)

      // Assert
      expect(keys).toEqual([key])
    })
  })

  describe("rewriteAssetKeys", () => {
    it("rewrites whole-string asset references and leaves others untouched", () => {
      // Arrange
      const siteId = 3
      const oldKey = `${siteId}/550e8400-e29b-41d4-a716-446655440000/doc.pdf`
      const newKey = `${siteId}/660e8400-e29b-41d4-a716-446655440001/doc.pdf`
      const map = new Map([[oldKey, newKey]])
      const content = {
        a: `/${oldKey}`,
        b: oldKey,
        c: "leave-me",
      }

      // Act
      rewriteAssetKeys(content, siteId, map)

      // Assert
      expect(content).toEqual({
        a: `/${newKey}`,
        b: newKey,
        c: "leave-me",
      })
    })
  })
})
