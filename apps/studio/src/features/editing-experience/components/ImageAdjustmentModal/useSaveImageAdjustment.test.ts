import { backOff } from "exponential-backoff"
import { describe, it, expect } from "vitest"
import { getAssetUploadBackoffOptions } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"

import {
  resolveOriginalKey,
  chooseBakeMime,
  validateCropBounds,
} from "./useSaveImageAdjustment"

describe("useSaveImageAdjustment pure helpers", () => {
  describe("resolveOriginalKey", () => {
    it("returns draft.originalKey when it exists", () => {
      const currentSrc = "/path/to/baked.jpg"
      const draft = {
        originalKey: "path/to/original.png",
        crop: { x: 0, y: 0, width: 1, height: 1 },
        focal: { x: 0.5, y: 0.5 },
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

    it("throws for non-bakeable formats (GIF)", () => {
      expect(() => chooseBakeMime("image/gif")).toThrow()
    })

    it("throws for non-bakeable formats (AVIF)", () => {
      expect(() => chooseBakeMime("image/avif")).toThrow()
    })

    it("throws for non-bakeable formats (TIFF)", () => {
      expect(() => chooseBakeMime("image/tiff")).toThrow()
    })

    it("throws for vector formats (SVG)", () => {
      expect(() => chooseBakeMime("image/svg+xml")).toThrow()
    })
  })

  describe("validateCropBounds", () => {
    it("accepts a full-image crop", () => {
      expect(() =>
        validateCropBounds({ x: 0, y: 0, width: 1, height: 1 }),
      ).not.toThrow()
    })

    it("accepts a crop that exactly touches the far edges", () => {
      expect(() =>
        validateCropBounds({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }),
      ).not.toThrow()
    })

    it("throws when x + width exceeds 1", () => {
      expect(() =>
        validateCropBounds({ x: 0.2, y: 0, width: 1, height: 1 }),
      ).toThrow()
    })

    it("throws when y + height exceeds 1", () => {
      expect(() =>
        validateCropBounds({ x: 0, y: 0.3, width: 1, height: 0.8 }),
      ).toThrow()
    })

    it("throws for a zero-width crop", () => {
      expect(() =>
        validateCropBounds({ x: 0, y: 0, width: 0, height: 1 }),
      ).toThrow()
    })

    it("throws for a zero-height crop", () => {
      expect(() =>
        validateCropBounds({ x: 0, y: 0, width: 1, height: 0 }),
      ).toThrow()
    })
  })
})

// The hook's save deadline is enforced by a single AbortController threaded
// through fetch/backOff calls (see useSaveImageAdjustment.ts). These test the
// two load-bearing assumptions directly, without mocking the whole
// useMutation/tRPC stack: that fetch honors a custom abort reason, and that
// the retry predicate actually cuts a backOff loop short instead of letting
// it run its full budget.
describe("save deadline mechanics", () => {
  it("fetch rejects with the AbortController's own reason once aborted", async () => {
    const controller = new AbortController()
    const reason = new Error("Saving took too long. Please try again.")
    controller.abort(reason)

    await expect(
      fetch("https://example.invalid/test", { signal: controller.signal }),
    ).rejects.toBe(reason)
  })

  it("stops a backOff loop once aborted, instead of exhausting all retries", async () => {
    const controller = new AbortController()
    const reason = new Error("Saving took too long. Please try again.")
    let attempts = 0

    setTimeout(() => controller.abort(reason), 15)

    const attempt = () => {
      attempts++
      if (controller.signal.aborted) throw controller.signal.reason
      throw new Error("not ready yet")
    }

    await expect(
      backOff(attempt, {
        ...getAssetUploadBackoffOptions({
          numOfAttempts: 10,
          baseTimeoutMs: 5,
        }),
        retry: () => !controller.signal.aborted,
      }),
    ).rejects.toBe(reason)

    expect(attempts).toBeLessThan(10)
  })
})
