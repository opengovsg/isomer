import { describe, expect, it } from "vitest"

import {
  MAX_BATCH_RESOURCE_IDS,
  getBatchAncestryWithSelfSchema,
  searchWithResourceIdsSchema,
} from "../resource"

const createResourceIds = (size: number): string[] =>
  Array.from({ length: size }, (_, index) => String(index + 1))

describe("resource batch query schemas", () => {
  it("accepts getBatchAncestryWithSelfSchema payloads at the max boundary", () => {
    const result = getBatchAncestryWithSelfSchema.safeParse({
      siteId: "1",
      resourceIds: createResourceIds(MAX_BATCH_RESOURCE_IDS),
    })

    expect(result.success).toBe(true)
  })

  it("rejects getBatchAncestryWithSelfSchema payloads above the max boundary", () => {
    const result = getBatchAncestryWithSelfSchema.safeParse({
      siteId: "1",
      resourceIds: createResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["resourceIds"])
    }
  })

  it("accepts searchWithResourceIdsSchema payloads at the max boundary", () => {
    const result = searchWithResourceIdsSchema.safeParse({
      siteId: "1",
      resourceIds: createResourceIds(MAX_BATCH_RESOURCE_IDS),
    })

    expect(result.success).toBe(true)
  })

  it("rejects searchWithResourceIdsSchema payloads above the max boundary", () => {
    const result = searchWithResourceIdsSchema.safeParse({
      siteId: "1",
      resourceIds: createResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["resourceIds"])
    }
  })
})
