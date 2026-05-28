import { describe, expect, it } from "vitest"

import { createGazetteServerSchema, updateGazetteServerSchema } from "../gazette"

const validMetadata = {
  title: "Gazette notice",
  category: "Government Gazette",
  date: "30/04/2026",
  tagged: ["sub-1"],
  scheduledAt: new Date("2026-04-30T12:00:00.000Z"),
}

const validRef = "/1/8d8d7c95-c6f6-4b1e-9f9c-f1ef448fb5f8/notice.pdf"

describe("gazette server schemas", () => {
  describe("createGazetteServerSchema", () => {
    it("accepts canonical gazette S3 refs", () => {
      const result = createGazetteServerSchema.safeParse({
        ...validMetadata,
        siteId: 1,
        collectionId: 1,
        permalink: "notice",
        ref: validRef,
      })

      expect(result.success).toBe(true)
    })

    it("rejects non-canonical gazette refs", () => {
      const invalidRefs = [
        "1/8d8d7c95-c6f6-4b1e-9f9c-f1ef448fb5f8/notice.pdf",
        "/sites/1/gazettes/8d8d7c95-c6f6-4b1e-9f9c-f1ef448fb5f8/notice.pdf",
        "/1/not-a-uuid/notice.pdf",
        "/1/8d8d7c95-c6f6-4b1e-9f9c-f1ef448fb5f8/notice.docx",
      ]

      invalidRefs.forEach((ref) => {
        const result = createGazetteServerSchema.safeParse({
          ...validMetadata,
          siteId: 1,
          collectionId: 1,
          permalink: "notice",
          ref,
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe("updateGazetteServerSchema", () => {
    it("accepts canonical newRef values", () => {
      const result = updateGazetteServerSchema.safeParse({
        ...validMetadata,
        siteId: 1,
        gazetteId: 1,
        newRef: validRef,
      })

      expect(result.success).toBe(true)
    })

    it("rejects non-canonical newRef values", () => {
      const result = updateGazetteServerSchema.safeParse({
        ...validMetadata,
        siteId: 1,
        gazetteId: 1,
        newRef: "/1/not-a-uuid/notice.pdf",
      })

      expect(result.success).toBe(false)
    })
  })
})
