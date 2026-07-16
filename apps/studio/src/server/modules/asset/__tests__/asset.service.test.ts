import { TRPCError } from "@trpc/server"
import { describe, expect, it } from "vitest"

import {
  doAllFileKeysBelongToSite,
  getContentDispositionForKey,
  getContentTypeFromKey,
  getFileKey,
  getFileKeysFromBlobContent,
  getRemovedFileKeys,
  sanitizeSvg,
} from "../asset.service"

const SITE_ID = 42
// A valid uploaded-asset folder is a v4 UUID (see getFileKey).
const UUID_1 = "11111111-1111-4111-8111-111111111111"
const UUID_2 = "22222222-2222-4222-8222-222222222222"
const assetPath = (uuid: string, fileName: string) =>
  `/${SITE_ID}/${uuid}/${fileName}`

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
      expect(result).toMatch(/^inline; filename\*=UTF-8''/)
      expect(result).toContain(encodeURIComponent("test.png"))
    })

    it("should encode special characters in filename", () => {
      const result = getContentDispositionForKey("1/abc/测试文件.pdf")
      expect(result).toMatch(/^inline; filename\*=UTF-8''/)
      expect(result).toContain(encodeURIComponent("测试文件.pdf"))
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

  describe("getFileKeysFromBlobContent", () => {
    it("should return an empty array when there are no asset references", () => {
      const content = {
        layout: "content",
        page: { title: "No assets here" },
        content: [
          {
            type: "prose",
            content: [{ type: "paragraph", content: [{ text: "Hello" }] }],
          },
        ],
      }

      expect(getFileKeysFromBlobContent({ content, siteId: SITE_ID })).toEqual(
        [],
      )
    })

    it("should extract asset keys (without leading slash) from nested strings", () => {
      const content = {
        layout: "content",
        page: {
          image: { src: assetPath(UUID_1, "cover.png") },
        },
        content: [
          {
            type: "image",
            src: assetPath(UUID_2, "diagram.jpg"),
            alt: "Diagram",
          },
        ],
      }

      const result = getFileKeysFromBlobContent({ content, siteId: SITE_ID })

      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          `${SITE_ID}/${UUID_1}/cover.png`,
          `${SITE_ID}/${UUID_2}/diagram.jpg`,
        ]),
      )
    })

    it("should extract asset keys referenced from file-download links", () => {
      const content = {
        content: [
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [
                      {
                        type: "link",
                        attrs: { href: assetPath(UUID_1, "report.pdf") },
                      },
                    ],
                    text: "Download report [PDF, 1.00 MB]",
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(getFileKeysFromBlobContent({ content, siteId: SITE_ID })).toEqual([
        `${SITE_ID}/${UUID_1}/report.pdf`,
      ])
    })

    it("should de-duplicate a key referenced in multiple places", () => {
      const src = assetPath(UUID_1, "shared.png")
      const content = {
        content: [
          { type: "image", src },
          { type: "infopic", imageSrc: src },
        ],
      }

      expect(getFileKeysFromBlobContent({ content, siteId: SITE_ID })).toEqual([
        `${SITE_ID}/${UUID_1}/shared.png`,
      ])
    })

    it("should ignore assets that belong to a different site", () => {
      const content = {
        content: [
          { type: "image", src: assetPath(UUID_1, "mine.png") },
          { type: "image", src: `/999/${UUID_2}/theirs.png` },
        ],
      }

      expect(getFileKeysFromBlobContent({ content, siteId: SITE_ID })).toEqual([
        `${SITE_ID}/${UUID_1}/mine.png`,
      ])
    })

    it("should ignore internal links, external URLs, and legacy (non-UUID) paths", () => {
      const content = {
        content: [
          { type: "link", href: "[resource:42:123]" },
          { type: "link", href: "https://example.com/file.pdf" },
          { type: "link", href: "/about-us/contact" },
          // Legacy GitHub-hosted asset (no UUID folder) — not in our S3 bucket.
          { type: "link", href: `/${SITE_ID}/files/legacy.pdf` },
        ],
      }

      expect(getFileKeysFromBlobContent({ content, siteId: SITE_ID })).toEqual(
        [],
      )
    })

    it("should handle null, undefined, and non-object content safely", () => {
      expect(
        getFileKeysFromBlobContent({ content: null, siteId: SITE_ID }),
      ).toEqual([])
      expect(
        getFileKeysFromBlobContent({ content: undefined, siteId: SITE_ID }),
      ).toEqual([])
      expect(
        getFileKeysFromBlobContent({
          content: "just a string",
          siteId: SITE_ID,
        }),
      ).toEqual([])
    })
  })

  describe("getRemovedFileKeys", () => {
    it("should return keys present in before but absent in after", () => {
      const before = {
        content: [
          { type: "image", src: assetPath(UUID_1, "keep.png") },
          { type: "image", src: assetPath(UUID_2, "remove.png") },
        ],
      }
      const after = {
        content: [{ type: "image", src: assetPath(UUID_1, "keep.png") }],
      }

      expect(getRemovedFileKeys({ before, after, siteId: SITE_ID })).toEqual([
        `${SITE_ID}/${UUID_2}/remove.png`,
      ])
    })

    it("should return an empty array when no keys were removed", () => {
      const before = {
        content: [{ type: "image", src: assetPath(UUID_1, "keep.png") }],
      }
      const after = {
        content: [
          { type: "image", src: assetPath(UUID_1, "keep.png") },
          { type: "image", src: assetPath(UUID_2, "added.png") },
        ],
      }

      expect(getRemovedFileKeys({ before, after, siteId: SITE_ID })).toEqual([])
    })

    it("should treat all keys as removed when after has no assets", () => {
      const before = {
        content: [
          { type: "image", src: assetPath(UUID_1, "one.png") },
          { type: "image", src: assetPath(UUID_2, "two.png") },
        ],
      }
      const after = { content: [] }

      const result = getRemovedFileKeys({ before, after, siteId: SITE_ID })

      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          `${SITE_ID}/${UUID_1}/one.png`,
          `${SITE_ID}/${UUID_2}/two.png`,
        ]),
      )
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
