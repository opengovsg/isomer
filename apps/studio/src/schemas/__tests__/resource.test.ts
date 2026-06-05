import { describe, expect, it } from "vitest"

import { deleteResourceSchema, getParentSchema } from "../resource"

describe("resource schemas", () => {
  describe.each([
    ["deleteResourceSchema", deleteResourceSchema],
    ["getParentSchema", getParentSchema],
  ])("%s", (_, schema) => {
    it("should allow non-zero numeric resource IDs", () => {
      const result = schema.safeParse({
        siteId: 1,
        resourceId: "123",
      })

      expect(result.success).toBe(true)
    })

    it("should reject resource IDs that are not entirely numeric", () => {
      const testCases = ["abc123", "1abc", "<script>1"]

      testCases.forEach((resourceId) => {
        const result = schema.safeParse({
          siteId: 1,
          resourceId,
        })

        expect(result.success).toBe(false)
      })
    })

    it("should reject zero and resource IDs with leading zeros", () => {
      const testCases = ["0", "0123"]

      testCases.forEach((resourceId) => {
        const result = schema.safeParse({
          siteId: 1,
          resourceId,
        })

        expect(result.success).toBe(false)
      })
    })
  })
})
