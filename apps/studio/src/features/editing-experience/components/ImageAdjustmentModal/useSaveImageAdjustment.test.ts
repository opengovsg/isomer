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

      const result = resolveOriginalKey(currentSrc, draft)
      expect(result).toBe("path/to/original.jpg")
    })

    it("handles currentSrc without leading slash", () => {
      const currentSrc = "path/to/original.jpg"
      const draft = {
        originalKey: undefined,
      }

      const result = resolveOriginalKey(currentSrc, draft)
      expect(result).toBe("path/to/original.jpg")
    })
  })

  describe("chooseBakeMime", () => {
    it("returns the original MIME type for bakeable formats (JPEG)", () => {
      expect(chooseBakeMime("image/jpeg", "1/uuid/photo.jpg")).toBe(
        "image/jpeg",
      )
    })

    it("returns the original MIME type for bakeable formats (PNG)", () => {
      expect(chooseBakeMime("image/png", "1/uuid/photo.png")).toBe("image/png")
    })

    it("returns the original MIME type for bakeable formats (WebP)", () => {
      expect(chooseBakeMime("image/webp", "1/uuid/photo.webp")).toBe(
        "image/webp",
      )
    })

    // The bug on staging: the CDN served a real PNG as "binary/octet-stream",
    // which blocked saving. Fall back to the server-validated key extension.
    it("falls back to the key extension when the type is generic (octet-stream)", () => {
      expect(chooseBakeMime("binary/octet-stream", "1/uuid/photo.png")).toBe(
        "image/png",
      )
    })

    it("falls back to the key extension for the .jpg alias", () => {
      expect(chooseBakeMime("", "1/uuid/photo.jpg")).toBe("image/jpeg")
    })

    it("throws when both the type and key extension are non-bakeable", () => {
      expect(() => chooseBakeMime("image/gif", "1/uuid/anim.gif")).toThrow()
      expect(() => chooseBakeMime("image/avif", "1/uuid/photo.avif")).toThrow()
      expect(() => chooseBakeMime("image/tiff", "1/uuid/photo.tiff")).toThrow()
      expect(() =>
        chooseBakeMime("image/svg+xml", "1/uuid/vector.svg"),
      ).toThrow()
    })

    it("throws for a generic type with a non-image extension", () => {
      expect(() =>
        chooseBakeMime("binary/octet-stream", "1/uuid/doc.pdf"),
      ).toThrow()
    })
  })
})
