import { describe, it, expect } from "vitest"

import { resolveOriginalKey, chooseBakeMime } from "./useSaveImageAdjustment"

describe("useSaveImageAdjustment pure helpers", () => {
  describe("resolveOriginalKey", () => {
    it("returns draft.originalKey when it exists", () => {
      const currentSrc = "/path/to/baked.jpg"
      const draft = {
        originalKey: "path/to/original.png",
        crop: { x: 0, y: 0, width: 1, height: 1 },
        focal: { x: 0.5, y: 0.5 },
        rotate: 0 as const,
        flipH: false,
        flipV: false,
      }

      const result = resolveOriginalKey(currentSrc, draft)
      expect(result).toBe("path/to/original.png")
    })

    it("strips leading slash from currentSrc when originalKey is not set", () => {
      const currentSrc = "/path/to/original.jpg"
      const draft = {
        originalKey: undefined,
      }

      const result = resolveOriginalKey(
        currentSrc,
        draft as { originalKey?: string },
      )
      expect(result).toBe("path/to/original.jpg")
    })

    it("handles currentSrc without leading slash", () => {
      const currentSrc = "path/to/original.jpg"
      const draft = {
        originalKey: undefined,
      }

      const result = resolveOriginalKey(
        currentSrc,
        draft as { originalKey?: string },
      )
      expect(result).toBe("path/to/original.jpg")
    })
  })

  describe("chooseBakeMime", () => {
    it("returns the original MIME type for bakeable formats (JPEG)", () => {
      const result = chooseBakeMime("image/jpeg")
      expect(result).toBe("image/jpeg")
    })

    it("returns the original MIME type for bakeable formats (PNG)", () => {
      const result = chooseBakeMime("image/png")
      expect(result).toBe("image/png")
    })

    it("returns the original MIME type for bakeable formats (WebP)", () => {
      const result = chooseBakeMime("image/webp")
      expect(result).toBe("image/webp")
    })

    it("falls back to image/jpeg for non-bakeable formats (GIF)", () => {
      const result = chooseBakeMime("image/gif")
      expect(result).toBe("image/jpeg")
    })

    it("falls back to image/jpeg for non-bakeable formats (AVIF)", () => {
      const result = chooseBakeMime("image/avif")
      expect(result).toBe("image/jpeg")
    })

    it("falls back to image/jpeg for non-bakeable formats (TIFF)", () => {
      const result = chooseBakeMime("image/tiff")
      expect(result).toBe("image/jpeg")
    })
  })
})
