import { backOff } from "exponential-backoff"
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import { getAssetUploadBackoffOptions } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

import {
  chooseBakeMime,
  fetchImageBlob,
  resolveOriginalKey,
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
      expect(() => chooseBakeMime("image/gif", "1/uuid/anim.gif")).toThrow(
        /can't be adjusted/,
      )
      expect(() => chooseBakeMime("image/avif", "1/uuid/photo.avif")).toThrow(
        /can't be adjusted/,
      )
      expect(() => chooseBakeMime("image/tiff", "1/uuid/photo.tiff")).toThrow(
        /can't be adjusted/,
      )
      expect(() =>
        chooseBakeMime("image/svg+xml", "1/uuid/vector.svg"),
      ).toThrow(/can't be adjusted/)
    })

    it("throws for a generic type with a non-image extension", () => {
      expect(() =>
        chooseBakeMime("binary/octet-stream", "1/uuid/doc.pdf"),
      ).toThrow(/can't be adjusted/)
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

describe("fetchImageBlob", () => {
  // generateOriginalAssetUrl reads window.location (client-only code).
  beforeEach(() => {
    vi.stubGlobal("window", { location: { href: "http://localhost/" } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const okResponse = (blob: Blob) =>
    ({ ok: true, status: 200, blob: () => Promise.resolve(blob) }) as Response
  const errResponse = (status: number) =>
    ({ ok: false, status, blob: () => Promise.resolve(new Blob()) }) as Response

  it("returns the pristine original when ?original is available (no fallback)", async () => {
    const blob = new Blob(["png"], { type: "image/png" })
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse(blob))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchImageBlob("/1/uuid/photo.png")

    expect(result).toBe(blob)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toContain("?original=true")
  })

  it("appends original=true to existing queries and keeps encoded keys fetchable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(new Blob()))
    vi.stubGlobal("fetch", fetchMock)

    await fetchImageBlob("/1/uuid/beach photo.png?v=2")

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${ASSETS_BASE_URL}/1/uuid/beach%20photo.png?v=2&original=true`,
    )
  })

  it("falls back to the plain URL requesting webp when ?original is gated (403)", async () => {
    const webp = new Blob(["webp"], { type: "image/webp" })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(403))
      .mockResolvedValueOnce(okResponse(webp))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchImageBlob("/1/uuid/photo.png")

    expect(result).toBe(webp)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // The fallback must force webp — avif (the browser default) isn't bakeable.
    const fallbackUrl = fetchMock.mock.calls[1]?.[0] as string
    const fallbackInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined
    expect(fallbackUrl).not.toContain("original=true")
    expect(fallbackInit?.headers).toMatchObject({ Accept: "image/webp" })
  })

  it("requests only a prefix when maxBytes is given", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(403))
      .mockResolvedValueOnce(okResponse(new Blob(["webp"])))
    vi.stubGlobal("fetch", fetchMock)

    await fetchImageBlob("/1/uuid/photo.png", undefined, 1024)

    const originalInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const fallbackInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined
    expect(originalInit?.headers).toMatchObject({ Range: "bytes=0-1023" })
    expect(fallbackInit?.headers).toMatchObject({
      Accept: "image/webp",
      Range: "bytes=0-1023",
    })
  })

  it("throws when both the original and the fallback are gated", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(403))
      .mockResolvedValueOnce(errResponse(403))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchImageBlob("/1/uuid/photo.png")).rejects.toThrow(
      /Failed to fetch image/,
    )
  })

  it("falls back to the plain URL when ?original THROWS (CORS-opaque 403)", async () => {
    // Regression: a CORS-opaque error response makes the cors fetch reject
    // rather than resolve with !ok. The fallback must still run (a bare
    // `await fetch(original)` would abort before reaching it).
    const webp = new Blob(["webp"], { type: "image/webp" })
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(okResponse(webp))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchImageBlob("/1/uuid/photo.png")

    expect(result).toBe(webp)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("throws when ?original throws and the fallback also throws", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchImageBlob("/1/uuid/photo.png")).rejects.toThrow(
      /Failed to fetch image/,
    )
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
