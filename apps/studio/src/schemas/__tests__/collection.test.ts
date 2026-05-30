import { describe, expect, it } from "vitest"

import { editLinkSchema } from "../collection"

describe("editLinkSchema", () => {
  const validBaseData = {
    category: "news",
    linkId: 1,
    siteId: 1,
    ref: "https://example.com",
  }

  describe("date validation", () => {
    it("accepts a valid date and round-trips in dd/MM/yyyy format", () => {
      const result = editLinkSchema.safeParse({
        ...validBaseData,
        date: "31/01/2024",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.date).toBe("31/01/2024")
      }
    })

    it("rejects invalid dates such as Feb 29 in a non-leap year", () => {
      const result = editLinkSchema.safeParse({
        ...validBaseData,
        date: "29/02/2023",
      })

      expect(result.success).toBe(false)
    })

    it("rejects invalid day for month", () => {
      const result = editLinkSchema.safeParse({
        ...validBaseData,
        date: "31/02/2024",
      })

      expect(result.success).toBe(false)
    })
  })
})
