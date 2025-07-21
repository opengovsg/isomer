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
        expect(typeof result.data.siteId).toBe("string")
      }
    })
  })

  describe("pageSchema", () => {
    it("should validate a valid page with siteId and pageId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ siteId: "123", pageId: "456" })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ siteId: "789", pageId: "101" })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ siteId: 789, pageId: 101 })
        expect(typeof result.data.siteId).toBe("number")
        expect(typeof result.data.pageId).toBe("number")
      }
    })

    it("should reject undefined siteId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ siteId: undefined, pageId: "456" })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject undefined pageId", () => {
      // Arrange + Act
      const result = pageSchema.safeParse({ siteId: "789", pageId: undefined })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("collectionItemSchema", () => {
    it("should validate with both pageId and linkId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        siteId: "123",
        pageId: "456",
        linkId: "789",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        siteId: "123",
        pageId: "456",
        linkId: "789",
      })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, pageId: 456, linkId: 789 })
        expect(typeof result.data.siteId).toBe("number")
        expect(typeof result.data.pageId).toBe("number")
        expect(typeof result.data.linkId).toBe("number")
      }
    })

    it("should validate with only pageId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        siteId: "123",
        pageId: "456",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, pageId: 456 })
      }
    })

    it("should validate with only linkId", () => {
      // Arrange + Act
      const result = collectionItemSchema.safeParse({
        siteId: "123",
        linkId: "789",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, linkId: 789 })
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
        siteId: "123",
        pageId: "456",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should coerce string IDs to numbers", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
        pageId: "456",
        linkId: "789",
      })

      // Assert
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, pageId: 456, linkId: 789 })
        expect(typeof result.data.siteId).toBe("number")
        expect(typeof result.data.pageId).toBe("number")
        expect(typeof result.data.linkId).toBe("number")
      }
    })

    it("should validate with only pageId", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
        pageId: "456",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, pageId: 456 })
      }
    })

    it("should validate with only linkId", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
        linkId: "789",
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ siteId: 123, linkId: 789 })
      }
    })

    it("should reject when neither pageId nor linkId is provided", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1)
        expect(result.error.issues[0]?.message).toBe(
          "At least one of pageId or linkId must be present",
        )
      }
    })

    it("should reject when both pageId and linkId are undefined", () => {
      // Arrange + Act
      const result = pageOrLinkSchema.safeParse({
        siteId: "123",
        pageId: undefined,
        linkId: undefined,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1)
        expect(result.error.issues[0]?.message).toBe(
          "At least one of pageId or linkId must be present",
        )
      }
    })
  })
})
