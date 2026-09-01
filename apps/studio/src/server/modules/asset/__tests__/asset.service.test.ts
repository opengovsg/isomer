import { TRPCError } from "@trpc/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteFile } from "~/lib/s3"

import {
  deleteAssetsByUrl,
  doAllFileKeysBelongToSite,
  getContentDispositionForKey,
  getContentDispositionForTitle,
  getContentTypeFromKey,
  getFileKey,
  getSiteIdFromKey,
  parseAssetUrlToKey,
  sanitizeSvg,
} from "../asset.service"

// Mock the S3 client so these stay pure unit tests, matching asset.router.test.ts.
vi.mock("~/lib/s3", () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
}))

describe("asset.service", () => {
  describe("getContentTypeFromKey", () => {
    it("should return image MIME for image extensions", () => {
      expect(getContentTypeFromKey("1/abc/test.png")).toBe("image/png")
      expect(getContentTypeFromKey("1/abc/photo.jpg")).toBe("image/jpeg")
      expect(getContentTypeFromKey("1/abc/photo.jpeg")).toBe("image/jpeg")
      expect(getContentTypeFromKey("1/abc/icon.svg")).toBe("image/svg+xml")
      expect(getContentTypeFromKey("1/abc/art.webp")).toBe("image/webp")
    })

    it("should return document MIME for file extensions", () => {
      expect(getContentTypeFromKey("1/abc/doc.pdf")).toBe("application/pdf")
      expect(getContentTypeFromKey("1/abc/data.csv")).toBe("text/csv")
      expect(getContentTypeFromKey("1/abc/sheet.xlsx")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    })

    it("should return application/octet-stream for unknown extension", () => {
      expect(getContentTypeFromKey("1/abc/file.xyz")).toBe(
        "application/octet-stream",
      )
    })

    it("should use lowercase extension for lookup", () => {
      expect(getContentTypeFromKey("1/abc/file.PNG")).toBe("image/png")
    })

    it("should derive extension from lowercased segment so length-changing Unicode (e.g. İ) does not break lookup", () => {
      // İ (U+0130) → toLowerCase() is i + combining dot (2 code units). Using the
      // original segment's lastIndexOf(".") on the lowercased string would slice
      // at the wrong index and yield application/octet-stream without the fix.
      expect(getContentTypeFromKey("1/abc/İ.png")).toBe("image/png")
    })
  })

  describe("getContentDispositionForKey", () => {
    it("should return inline with filename from key segment", () => {
      const result = getContentDispositionForKey("1/abc-uuid/test.png")
      expect(result).toBe(`inline; filename=test.png`)
    })

    it("should encode non-latin1 characters via RFC 5987 with a latin1 fallback", () => {
      const result = getContentDispositionForKey("1/abc/测试文件.pdf")
      // filename= fallback for legacy clients, plus a correctly-encoded filename*
      expect(result).toBe(
        `inline; filename="????.pdf"; filename*=UTF-8''%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.pdf`,
      )
    })
  })

  describe("getContentDispositionForTitle", () => {
    it("should use the title as filename, keeping the key's extension", () => {
      const result = getContentDispositionForTitle(
        "Government Gazette No. 1",
        "2024/category/sub/file.pdf",
      )
      expect(result).toBe(`inline; filename="Government Gazette No. 1.pdf"`)
    })

    it("should encode non-latin1 titles via RFC 5987 with a latin1 fallback", () => {
      const result = getContentDispositionForTitle("测试文件", "1/abc/doc.pdf")
      expect(result).toBe(
        `inline; filename="????.pdf"; filename*=UTF-8''%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.pdf`,
      )
    })

    it("should omit the extension when the key has none", () => {
      const result = getContentDispositionForTitle("My Title", "1/abc/blob")
      expect(result).toBe(`inline; filename="My Title"`)
    })

    it("should preserve titles with path separators instead of truncating them", () => {
      const result = getContentDispositionForTitle("A/B\\C", "1/abc/doc.pdf")
      expect(result).toBe(`inline; filename=A-B-C.pdf`)
    })

    it("should emit valid headers for titles with RFC 5987 attr-chars ' ( ) *", () => {
      // encodeURIComponent leaves ' ( ) * unescaped, which is invalid inside a
      // filename* ext-value; the content-disposition package keeps them in a
      // quoted filename= instead, which is well-formed.
      const result = getContentDispositionForTitle(
        "O'Brien (No. 1)*",
        "1/abc/doc.pdf",
      )
      expect(result).toBe(`inline; filename="O'Brien (No. 1)*.pdf"`)
    })
  })

  describe("getFileKey", () => {
    it("should generate a file key with basic ASCII filename", () => {
      // Arrange
      const siteId = 123
      const fileName = "test-file.jpg"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^123\/[0-9a-f-]{36}\/test-file\.jpg$/)
    })

    it("should handle attempts at path traversal", () => {
      // Arrange
      const siteId = 123
      const fileName = "../../test.jpg"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^123\/[0-9a-f-]{36}\/-..-test\.jpg$/)
    })

    it("should handle unicode characters in filename", () => {
      // Arrange
      const siteId = 456
      const fileName = "测试文件.pdf"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^456\/[0-9a-f-]{36}\/测试文件\.pdf$/)
    })

    it("should handle emoji in filename", () => {
      // Arrange
      const siteId = 789
      const fileName = "🎉celebration🎊.png"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^789\/[0-9a-f-]{36}\/🎉celebration🎊\.png$/)
    })

    it("should handle mixed unicode and ASCII characters", () => {
      // Arrange
      const siteId = 101
      const fileName = "report-2024年度.docx"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^101\/[0-9a-f-]{36}\/report-2024年度\.docx$/)
    })

    it("should handle cyrillic characters", () => {
      // Arrange
      const siteId = 202
      const fileName = "документ.txt"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^202\/[0-9a-f-]{36}\/документ\.txt$/)
    })

    it("should handle arabic characters", () => {
      // Arrange
      const siteId = 303
      const fileName = "ملف.pdf"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^303\/[0-9a-f-]{36}\/ملف\.pdf$/)
    })

    it("should handle all special characters that might need sanitization even when the characters are not consecutive", () => {
      // Arrange
      const siteId = 404
      const fileName = '<fi:l|e<>:"|?*.txt'

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      // NOTE: Special characters in consecutive runs are compressed to single character
      expect(result).toMatch(/^404\/[0-9a-f-]{36}\/-fi-l-e-\.txt$/)
    })

    it("should handle special characters that might need sanitization", () => {
      // Arrange
      const siteId = 404
      const fileName = 'file<>:"|?*.txt'

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      // NOTE: Special characters in consecutive runs are compressed to single character
      expect(result).toMatch(/^404\/[0-9a-f-]{36}\/file-\.txt$/)
    })

    it("should handle very long unicode filename", () => {
      // Arrange
      const siteId = 505
      const longUnicodeName = "很长的文件名".repeat(20) + ".jpg"

      // Act
      const result = getFileKey({ siteId, fileName: longUnicodeName })

      // Assert
      expect(result).toMatch(/^505\/[0-9a-f-]{36}\/很长的文件名/)
      expect(result).toContain(".jpg")
    })

    it("should generate unique folder names for same filename", () => {
      // Arrange
      const siteId = 606
      const fileName = "同一个文件.pdf"

      // Act
      const result1 = getFileKey({ siteId, fileName })
      const result2 = getFileKey({ siteId, fileName })

      // Assert
      expect(result1).not.toEqual(result2)
      expect(result1).toMatch(/同一个文件\.pdf$/)
      expect(result2).toMatch(/同一个文件\.pdf$/)
    })

    it("should handle mixed scripts in filename", () => {
      // Arrange
      const siteId = 909
      const fileName = "English中文العربية.txt"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^909\/[0-9a-f-]{36}\/English中文العربية\.txt$/)
    })
  })

  describe("doAllFileKeysBelongToSite", () => {
    it("should return true when all file keys start with the siteId prefix", () => {
      expect(
        doAllFileKeysBelongToSite({
          siteId: 25,
          fileKeys: ["25/uuid-1/image.png", "25/uuid-2/doc.pdf"],
        }),
      ).toBe(true)
    })

    it("should return true for empty file keys array", () => {
      expect(
        doAllFileKeysBelongToSite({
          siteId: 25,
          fileKeys: [],
        }),
      ).toBe(true)
    })

    it("should return true for single key belonging to site", () => {
      expect(
        doAllFileKeysBelongToSite({
          siteId: 1,
          fileKeys: ["1/abc-123/file.jpg"],
        }),
      ).toBe(true)
    })

    it("should return false when one key belongs to another site", () => {
      expect(
        doAllFileKeysBelongToSite({
          siteId: 25,
          fileKeys: ["25/uuid-1/image.png", "99/other-site/attacker.png"],
        }),
      ).toBe(false)
    })

    it("should return false when key has no site prefix", () => {
      expect(
        doAllFileKeysBelongToSite({
          siteId: 25,
          fileKeys: ["bare-filename.png"],
        }),
      ).toBe(false)
    })

    it("should return false when key prefix is a different site id (no slash collision)", () => {
      // siteId 2 should not match "25/..."
      expect(
        doAllFileKeysBelongToSite({
          siteId: 2,
          fileKeys: ["25/uuid/file.png"],
        }),
      ).toBe(false)
    })

    it("should return true when siteId is substring but key has correct prefix with slash", () => {
      // "2/" prefix only matches siteId 2
      expect(
        doAllFileKeysBelongToSite({
          siteId: 2,
          fileKeys: ["2/uuid/file.png"],
        }),
      ).toBe(true)
    })
  })

  describe("parseAssetUrlToKey", () => {
    // Matches NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME in .env.test.
    const ASSET_DOMAIN = "user-content.example.com"
    const UUID = "11111111-1111-1111-1111-111111111111"

    it("should extract the key from a well-formed asset URL", () => {
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/${UUID}/picture.png`,
      )
      expect(result).toBe(`36/${UUID}/picture.png`)
    })

    it("should decode percent-encoded characters in the path", () => {
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/${UUID}/my%20file.png`,
      )
      expect(result).toBe(`36/${UUID}/my file.png`)
    })

    it("should not truncate the key at an unescaped '#' in the filename", () => {
      // filenamify's reserved-character list doesn't strip '#', so a
      // legitimately uploaded file can have one — the WHATWG URL parser
      // would otherwise treat it as the start of a fragment and drop it
      // and everything after it from `.pathname`.
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/${UUID}/my#file.png`,
      )
      expect(result).toBe(`36/${UUID}/my#file.png`)
    })

    it("should drop a query string rather than folding it into the key", () => {
      // A real asset key can never contain '?' (filenamify strips it), so
      // a query string on a pasted URL is never part of the filename.
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/${UUID}/picture.png?download=1`,
      )
      expect(result).toBe(`36/${UUID}/picture.png`)
    })

    it("should trim surrounding whitespace before parsing", () => {
      const result = parseAssetUrlToKey(
        `  https://${ASSET_DOMAIN}/36/${UUID}/file.png  `,
      )
      expect(result).toBe(`36/${UUID}/file.png`)
    })

    it("should return null for a malformed URL", () => {
      expect(parseAssetUrlToKey("not-a-url")).toBeNull()
    })

    it("should return null for an empty string", () => {
      expect(parseAssetUrlToKey("")).toBeNull()
    })

    it("should return null when the URL is on a different host", () => {
      const result = parseAssetUrlToKey(
        `https://evil.example.com/36/${UUID}/picture.png`,
      )
      expect(result).toBeNull()
    })

    it("should return null when the path has extra segments", () => {
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/${UUID}/nested/picture.png`,
      )
      expect(result).toBeNull()
    })

    it("should return null when the folder segment is not a UUID", () => {
      const result = parseAssetUrlToKey(
        `https://${ASSET_DOMAIN}/36/uuid/picture.png`,
      )
      expect(result).toBeNull()
    })
  })

  describe("getSiteIdFromKey", () => {
    it("should return the first path segment as the siteId", () => {
      expect(getSiteIdFromKey("36/uuid/picture.png")).toBe("36")
    })

    it("should return the whole string when there is no slash", () => {
      expect(getSiteIdFromKey("picture.png")).toBe("picture.png")
    })

    it("should return undefined for an empty key", () => {
      expect(getSiteIdFromKey("")).toBeUndefined()
    })
  })

  describe("deleteAssetsByUrl", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    // Matches NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME in .env.test.
    const ASSET_DOMAIN = "user-content.example.com"
    const UUID_1 = "11111111-1111-1111-1111-111111111111"
    const UUID_2 = "22222222-2222-2222-2222-222222222222"

    it("should mark each valid URL's key as deleted and report success", async () => {
      // Arrange
      const urls = [
        `https://${ASSET_DOMAIN}/36/${UUID_1}/a.png`,
        `https://${ASSET_DOMAIN}/37/${UUID_2}/b.png`,
      ]

      // Act
      const results = await deleteAssetsByUrl(urls)

      // Assert
      expect(results).toEqual([
        { url: urls[0], key: `36/${UUID_1}/a.png`, success: true },
        { url: urls[1], key: `37/${UUID_2}/b.png`, success: true },
      ])
      expect(deleteFile).toHaveBeenCalledTimes(2)
    })

    it("should report failure for an invalid URL without calling deleteFile", async () => {
      // Act
      const results = await deleteAssetsByUrl(["not-a-url"])

      // Assert
      expect(results).toEqual([
        { url: "not-a-url", success: false, error: "Invalid asset URL" },
      ])
      expect(deleteFile).not.toHaveBeenCalled()
    })

    it("should report a generic failure message when deleteFile rejects, without failing other URLs", async () => {
      // Arrange
      vi.mocked(deleteFile)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("S3 unavailable"))
      const urls = [
        `https://${ASSET_DOMAIN}/36/${UUID_1}/a.png`,
        `https://${ASSET_DOMAIN}/37/${UUID_2}/b.png`,
      ]

      // Act
      const results = await deleteAssetsByUrl(urls)

      // Assert — the underlying provider error is logged server-side, not
      // returned to the caller.
      expect(results).toEqual([
        { url: urls[0], key: `36/${UUID_1}/a.png`, success: true },
        {
          url: urls[1],
          key: `37/${UUID_2}/b.png`,
          success: false,
          error: "Failed to delete asset",
        },
      ])
    })
  })

  describe("sanitizeSvg", () => {
    it("should return sanitized content for a valid SVG without altering safe elements or attributes", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert — DOMPurify normalises self-closing tags to explicit close tags
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should strip <script> tag from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><script>alert(1)</script></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should strip onload attribute from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="10" height="10"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should throw BAD_REQUEST when root element is not svg (HTML document)", () => {
      // Arrange
      const input = "<!DOCTYPE html><html><body></body></html>"

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Root element is not a valid SVG element",
        }),
      )
    })

    it("should throw BAD_REQUEST for XML entity declaration", () => {
      // Arrange
      const input =
        '<!ENTITY xxe "test"><svg xmlns="http://www.w3.org/2000/svg"/>'

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "SVG contains disallowed XML entities",
        }),
      )
    })

    it("should throw BAD_REQUEST for billion-laughs XML entity bomb", () => {
      // Arrange
      // Billion-laughs: exponential entity expansion that exhausts server memory
      // at parse time. Must be caught by the <!ENTITY regex BEFORE DOMParser runs —
      // DOMPurify operates on the already-parsed DOM and cannot prevent this.
      const input = `<!DOCTYPE svg [
        <!ENTITY lol "lol">
        <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
        <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
      ]>
      <svg xmlns="http://www.w3.org/2000/svg">&lol3;</svg>`

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "SVG contains disallowed XML entities",
        }),
      )
    })

    it("should throw BAD_REQUEST for non-XML binary/random string", () => {
      // Arrange
      const input = "not an svg at all, just random text"

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "SVG failed to parse as valid XML",
        }),
      )
    })

    it("should throw BAD_REQUEST for empty string", () => {
      // Arrange
      const input = ""

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "SVG failed to parse as valid XML",
        }),
      )
    })

    it("should strip foreignObject tag from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><foreignObject><div>evil</div></foreignObject></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should strip use tag from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><use href="http://evil.com/evil.svg#xss"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should strip onclick attribute from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" onclick="alert(1)"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should strip onerror attribute from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><image onerror="alert(1)"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect><image></image></svg>',
      )
    })

    it("should strip onmouseover attribute from SVG without touching other content", () => {
      // Arrange
      const input =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" onmouseover="alert(1)"/></svg>'

      // Act
      const result = sanitizeSvg(input)

      // Assert
      expect(result).toEqual(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"></rect></svg>',
      )
    })

    it("should throw BAD_REQUEST for valid XML that is not SVG", () => {
      // Arrange
      const input = '<root xmlns="http://example.com"><child/></root>'

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Root element is not a valid SVG element",
        }),
      )
    })

    it("should throw BAD_REQUEST for malformed XML", () => {
      // Arrange
      const input = '<svg xmlns="http://www.w3.org/2000/svg"><unclosed>'

      // Act & Assert
      expect(() => sanitizeSvg(input)).toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "SVG failed to parse as valid XML",
        }),
      )
    })
  })
})
