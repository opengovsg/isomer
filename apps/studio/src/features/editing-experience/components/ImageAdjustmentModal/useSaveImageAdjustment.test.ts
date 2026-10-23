import { afterEach, describe, it, expect, vi } from "vitest"

import {
  chooseBakeMime,
  fetchImageBlob,
  resolveOriginalKey,
} from "./useSaveImageAdjustment"

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

describe("fetchImageBlob", () => {
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
