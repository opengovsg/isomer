import { describe, expect, it } from "vitest"

import {
  bulkRedirectsCsvSchema,
  createRedirectSchema,
  MAX_BULK_REDIRECT_CSV_BYTES,
  MAX_REDIRECT_DESTINATION_LENGTH,
  MAX_REDIRECT_SOURCE_LENGTH,
} from "../redirect"

const VALID_REDIRECT = {
  siteId: 1,
  source: "/old-page",
  destination: "/new-page",
}

describe("createRedirectSchema", () => {
  describe("source", () => {
    it("should normalise the source to a single leading slash with no trailing slash", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "old//path/",
      })

      // Assert
      expect(result.source).toBe("/old/path")
    })

    it("should lowercase the source (page permalinks are lowercase-only)", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "/Contact-Us",
      })

      // Assert
      expect(result.source).toBe("/contact-us")
    })

    it("should keep an already-normalised source unchanged", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse(VALID_REDIRECT)

      // Assert
      expect(result.source).toBe("/old-page")
    })

    it("should reject sources containing control characters", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/bad\tpath",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject sources containing backslashes", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/bad\\path",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject sources containing '..' path segments", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/foo/../bar",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should preserve single '.' characters in the source", () => {
      // Arrange / Act
      // The whitelist allows "." so real filenames/versions survive — only ".."
      // path segments are rejected
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "/files/report.v2.pdf",
      })

      // Assert
      expect(result.source).toBe("/files/report.v2.pdf")
    })

    it("should reject sources with characters outside the whitelist", () => {
      // Arrange
      const invalidSources = ["/bad path", "/with<angle>", "/curly{brace}"]

      invalidSources.forEach((source) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          source,
        })

        // Assert
        expect(result.success).toBe(false)
      })
    })

    it("should reject sources consisting only of slashes", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "///",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject an empty source", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it(`should accept a source at the max length of ${MAX_REDIRECT_SOURCE_LENGTH}`, () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "a".repeat(MAX_REDIRECT_SOURCE_LENGTH),
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject a source longer than the max length", () => {
      // Arrange / Act
      // Sources become part of an S3 object key, so the cap is far tighter than
      // the destination's — a value under the destination limit is still
      // rejected here.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "a".repeat(MAX_REDIRECT_SOURCE_LENGTH + 1),
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          "Source path is too long",
        )
      }
    })

    it("should reject sources under the reserved /_next prefix", () => {
      // Arrange
      // The prefix itself and anything nested beneath it is reserved, and the
      // check is on the normalised value so a missing leading slash is caught
      // too.
      const reservedSources = ["/_next", "/_next/static/chunk.js", "_next/data"]

      reservedSources.forEach((source) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          source,
        })

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.map((issue) => issue.message)).toContain(
            "This path is reserved and can't be used as a redirect source",
          )
        }
      })
    })

    it("should accept a source that merely starts with the reserved prefix as a substring", () => {
      // Arrange / Act
      // "/_nextgen" is not under "/_next/", so it must not be blocked.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/_nextgen",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject a source that is a full URL with the design copy", () => {
      // Arrange
      const urlSources = [
        "https://example.gov.sg/page",
        "http://example.com",
        "ftp://example.com/file",
      ]

      urlSources.forEach((source) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          source,
        })

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.map((issue) => issue.message)).toContain(
            "Enter what comes behind your URL (e.g., /contact-us).",
          )
        }
      })
    })

    it("should trim surrounding whitespace from the source", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "  /old-page  ",
      })

      // Assert
      expect(result.source).toBe("/old-page")
    })

    it("should reject sources containing a wildcard with the unsupported-wildcard message", () => {
      // Arrange
      const wildcardSources = ["/promo/*", "/promo/**", "/pro*mo"]

      wildcardSources.forEach((source) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          source,
        })

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.map((issue) => issue.message)).toContain(
            "Wildcards aren't supported yet — enter the full path",
          )
        }
      })
    })
  })

  describe("destination", () => {
    it("should normalise an internal destination to a single leading slash with no trailing slash", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "/new//path/",
      })

      // Assert
      expect(result.destination).toBe("/new/path")
    })

    it("should leave an external https destination exactly as entered", () => {
      // Arrange / Act
      // Trailing slashes / query strings are meaningful off-site, so the
      // external URL must not be rewritten by the path normaliser.
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/path/?ref=1",
      })

      // Assert
      expect(result.destination).toBe("https://www.example.gov.sg/path/?ref=1")
    })

    it("should accept destinations starting with '/'", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse(VALID_REDIRECT)

      // Assert
      expect(result.success).toBe(true)
    })

    it("should trim surrounding whitespace from an internal destination", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "  /new-page  ",
      })

      // Assert
      expect(result.destination).toBe("/new-page")
    })

    it("should accept destinations starting with 'https://'", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/page",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should accept an internal page reference as the destination", () => {
      // Arrange / Act
      // A destination may already be a [resource:...] reference (the form the
      // service stores internal paths as)
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "[resource:1:2]",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject destinations with other prefixes using the design copy", () => {
      // Arrange
      const invalidDestinations = [
        "http://example.com",
        "javascript:alert(1)",
        "example.com/page",
        "link with space",
        // Doubled scheme parses as a URL with hostname "https" — a prefix check
        // would let it through, the host-must-have-a-dot rule rejects it.
        "https://https://www.isomer.gov.sg",
        // Bare single-label hosts are never valid public redirect targets.
        "https://localhost",
        "https://",
      ]

      invalidDestinations.forEach((destination) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          destination,
        })

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.map((issue) => issue.message)).toContain(
            "Enter a valid path (/path-to-page) or URL (starts with www., http://, or https://).",
          )
        }
      })
    })

    it("should accept a destination longer than the source limit", () => {
      // Arrange / Act
      // External URLs are legitimately long, so the destination limit is far
      // more generous than the source's — a value over the source cap but under
      // the destination cap is accepted.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: `/${"a".repeat(MAX_REDIRECT_SOURCE_LENGTH + 1)}`,
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject a destination longer than the max length", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: `/${"a".repeat(MAX_REDIRECT_DESTINATION_LENGTH)}`,
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          "Destination is too long",
        )
      }
    })

    it("should strip control characters from an internal-path destination", () => {
      // Arrange / Act — a stray control char is silently removed rather than
      // blocking the user; the stored value is left control-char-free.
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "/bad\tpath",
      })

      // Assert
      expect(result.destination).toBe("/badpath")
    })

    it("should reject destinations containing backslashes", () => {
      // Arrange / Act — "\\" is ambiguous and could form an open redirect, so it
      // is rejected outright rather than stripped.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "/bad\\path",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should collapse a protocol-relative '//' destination to a single leading slash", () => {
      // Arrange / Act: "//evil.com" would otherwise be an open redirect.
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "//evil.com",
      })

      // Assert
      expect(result.destination).toBe("/evil.com")
    })

    it("should leave an external https destination untouched", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/a//b",
      })

      // Assert
      expect(result.destination).toBe("https://www.example.gov.sg/a//b")
    })

    it("should allow a query string on an internal path", () => {
      // Arrange / Act: a "?suffix" can't map to one resource, so it stays a
      // literal path rather than being converted to a reference.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "/search?q=tax",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should allow an internal path that links to an on-page anchor", () => {
      // Arrange / Act: anchors are permitted on internal paths too — the
      // published redirect's Location header can carry the fragment.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "/page#section",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should allow a #fragment on an external https URL", () => {
      // Arrange / Act: fragments are legitimate on external destinations too.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/page#section",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should strip control characters (CRLF/NUL) from an https destination", () => {
      // Arrange — control bytes are stripped before storage, so a CR/LF can
      // never reach the published redirect rules (S3 metadata / the CloudFront
      // Location header) where it could inject a response header.
      const cases = [
        {
          input: "https://evil.gov.sg/\r\npath",
          expected: "https://evil.gov.sg/path",
        },
        { input: "https://evil.gov.sg/\x00", expected: "https://evil.gov.sg/" },
        {
          input: "https://evil.gov.sg/\ttab",
          expected: "https://evil.gov.sg/tab",
        },
      ]

      cases.forEach(({ input, expected }) => {
        // Act
        const result = createRedirectSchema.parse({
          ...VALID_REDIRECT,
          destination: input,
        })

        // Assert
        expect(result.destination).not.toMatch(/[\x00-\x1f\x7f]/)
        expect(result.destination).toBe(expected)
      })
    })

    it("should reject destinations with '..' path segments", () => {
      // Arrange — "../" traversal is banned outright (internal path and external
      // https URL alike), since it is never meaningful in a redirect target.
      const invalidDestinations = [
        "/foo/../bar",
        "https://www.example.gov.sg/foo/../bar",
      ]

      invalidDestinations.forEach((destination) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          destination,
        })

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe("source and destination", () => {
    it("should reject a redirect from a source to itself with the design copy", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/same",
        destination: "/same",
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          "You can't redirect a URL to itself.",
        )
      }
    })

    it("should reject when source and destination differ only by normalisation", () => {
      // Arrange / Act
      // Source normalises to "/same"; the trailing slash on the destination
      // must not let an identical redirect through.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "same//",
        destination: "/same/",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should accept a redirect to a different internal path", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/here",
        destination: "/there",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should accept an external destination that matches the source path", () => {
      // Arrange / Act
      // An external URL can never equal an internal source, so the same-as
      // check does not apply.
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/same",
        destination: "https://example.gov.sg/same",
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })
})

describe("bulkRedirectsCsvSchema", () => {
  it("accepts a small valid CSV", () => {
    // Arrange / Act
    const result = bulkRedirectsCsvSchema.safeParse({
      siteId: 1,
      csv: "When someone visits,Redirect them to\n/old,/new",
    })

    // Assert
    expect(result.success).toBe(true)
  })

  it("rejects a CSV over the byte limit even when under the UTF-16 length limit", () => {
    // Arrange: "字" is one UTF-16 code unit but three UTF-8 bytes, so this string
    // stays under the code-unit ceiling while its byte size exceeds the cap — the
    // limit must be enforced in bytes, not code units.
    const csv = "字".repeat(400_000)
    expect(csv.length).toBeLessThanOrEqual(MAX_BULK_REDIRECT_CSV_BYTES)
    expect(new TextEncoder().encode(csv).length).toBeGreaterThan(
      MAX_BULK_REDIRECT_CSV_BYTES,
    )

    // Act
    const result = bulkRedirectsCsvSchema.safeParse({ siteId: 1, csv })

    // Assert
    expect(result.success).toBe(false)
  })
})
