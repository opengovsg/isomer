import { describe, expect, it } from "vitest"

import {
  collectionItemSchema,
  pageOrLinkSchema,
  pageSchema,
  siteSchema,
} from "../schema"

describe("editing-experience schemas", () => {
  describe("siteSchema", () => {
    it("should validate a valid siteId", () => {
      // Arrange + Act
      const result = siteSchema.safeParse({ siteId: "123" })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string siteId to string", () => {
      // Arrange + Act
      const result = siteSchema.safeParse({ siteId: "456" })

      // Assert
      if (result.success) {
        expect(result.data.siteId).toBe("456")
      }
    })
  })

  describe("pageSchema", () => {
    it("should validate a valid page with siteId and pageId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ pageId: "456", siteId: "123" })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ pageId: "101", siteId: "789" })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ pageId: 101, siteId: 789 })
      }
    })

    it("should reject undefined siteId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ pageId: "456", siteId: undefined })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject undefined pageId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ pageId: undefined, siteId: "789" })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("collectionItemSchema", () => {
    it("should validate with both pageId and linkId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        linkId: "789",
        pageId: "456",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        linkId: "789",
        pageId: "456",
        siteId: "123",
      })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ linkId: 789, pageId: 456, siteId: 123 })
      }
    })

    it("should validate with only pageId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        pageId: "456",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ pageId: 456, siteId: 123 })
      }
    })

    it("should validate with only linkId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        linkId: "789",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ linkId: 789, siteId: 123 })
      }
    })

    it("should validate with neither pageId nor linkId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123 })
      }
    })
  })

  describe("pageOrLinkSchema", () => {
    it("should validate with only pageId", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        pageId: "456",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        linkId: "789",
        pageId: "456",
        siteId: "123",
      })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ linkId: 789, pageId: 456, siteId: 123 })
      }
    })

    it("should validate with only pageId", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        pageId: "456",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ pageId: 456, siteId: 123 })
      }
    })

    it("should validate with only linkId", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        linkId: "789",
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ linkId: 789, siteId: 123 })
      }
    })

    it("should still pass when neither pageId nor linkId is provided", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123 })
      }
    })

    it("should still pass when both pageId and linkId are undefined", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        linkId: undefined,
        pageId: undefined,
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123 })
      }
    })
  })
})
