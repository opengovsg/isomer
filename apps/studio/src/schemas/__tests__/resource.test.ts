import { describe, expect, it } from "vitest"

import {
  getBatchAncestryWithSelfSchema,
  MAX_BATCH_RESOURCE_IDS,
  searchWithResourceIdsSchema,
} from "../resource"

const makeResourceIds = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${index + 1}`)

describe("resource schema batch limits", () => {
  it("keeps the batch resource ID cap at a safe value", () => {
    expect(MAX_BATCH_RESOURCE_IDS).toBe(25)
  })

  describe("getBatchAncestryWithSelfSchema", () => {
    it("accepts requests up to MAX_BATCH_RESOURCE_IDS", () => {
      const result = getBatchAncestryWithSelfSchema.safeParse({
        siteId: "1",
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS),
      })

      expect(result.success).toBe(true)
    })

    it("rejects requests over MAX_BATCH_RESOURCE_IDS", () => {
      const result = getBatchAncestryWithSelfSchema.safeParse({
        siteId: "1",
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
      })

      expect(result.success).toBe(false)
    })
  })

  describe("searchWithResourceIdsSchema", () => {
    it("accepts requests up to MAX_BATCH_RESOURCE_IDS", () => {
      const result = searchWithResourceIdsSchema.safeParse({
        siteId: "1",
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS),
      })

      expect(result.success).toBe(true)
    })

    it("rejects requests over MAX_BATCH_RESOURCE_IDS", () => {
      const result = searchWithResourceIdsSchema.safeParse({
        siteId: "1",
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
      })

      expect(result.success).toBe(false)
    })

    it("rejects invalid bigint resource IDs", () => {
      const result = searchWithResourceIdsSchema.safeParse({
        siteId: "1",
        resourceIds: ["01", "2"],
      })

      expect(result.success).toBe(false)
    })
  })
})
