import { describe, expect, it } from "vitest"

import {
  buildManifest,
  normalizeSource,
  partitionRedirects,
  resolveConcurrency,
} from "../uploadRedirects"

describe("resolveConcurrency", () => {
  it("uses S3_SYNC_CONCURRENCY when it is a positive integer", () => {
    expect(resolveConcurrency("47")).toBe(47)
  })

  it("falls back to 20 when unset or invalid", () => {
    expect(resolveConcurrency(undefined)).toBe(20)
    expect(resolveConcurrency("")).toBe(20)
    expect(resolveConcurrency("0")).toBe(20)
    expect(resolveConcurrency("-1")).toBe(20)
    expect(resolveConcurrency("nope")).toBe(20)
  })
})

// A redirect `source` is stored percent-encoded (the source schema forbids a
// raw space, so a space is persisted as "%20"). CloudFront percent-decodes the
// request path before it fetches from S3, so the object must be keyed by the
// DECODED path — otherwise the request 404s against a "%20" key that no
// incoming request ever reaches.
describe("normalizeSource", () => {
  it("percent-decodes a %20 source so the S3 key matches the decoded path CloudFront fetches", () => {
    // Arrange / Act
    const key = normalizeSource(
      "/files/conserved-buildings/trinity%20church11.4.05.pdf",
    )

    // Assert
    expect(key).toBe("files/conserved-buildings/trinity church11.4.05.pdf")
  })

  it("percent-decodes other encoded octets in the source", () => {
    // Arrange / Act / Assert
    expect(normalizeSource("/a%28b%29c")).toBe("a(b)c")
  })

  it("leaves an already-decoded source unchanged", () => {
    // Arrange / Act / Assert
    expect(normalizeSource("/-/media/corporate/list.pdf")).toBe(
      "-/media/corporate/list.pdf",
    )
  })

  it("trims and collapses slashes", () => {
    // Arrange / Act / Assert
    expect(normalizeSource("//foo//bar//")).toBe("foo/bar")
  })

  it("rejects a traversal segment smuggled in via percent-encoding", () => {
    // Arrange / Act / Assert — "%2e%2e" decodes to ".."
    expect(normalizeSource("/foo/%2e%2e/bar")).toBeNull()
  })

  it("rejects a control character smuggled in via percent-encoding", () => {
    // Arrange / Act / Assert — "%00" decodes to NUL
    expect(normalizeSource("/foo%00bar")).toBeNull()
  })

  it("rejects malformed percent-encoding", () => {
    // Arrange / Act / Assert — a lone "%" is not a valid escape sequence
    expect(normalizeSource("/foo%bar")).toBeNull()
  })
})

describe("partitionRedirects", () => {
  it("splits exact from wildcard/query by source shape", () => {
    const { exact, manifestEntries } = partitionRedirects([
      { source: "/faq", destination: "/faqs" },
      { source: "/news/*", destination: "/newsroom" },
      { source: "/gallery?a=1", destination: "https://x.gov.sg/g" },
    ])
    expect(exact.map((r) => r.source)).toEqual(["/faq"])
    expect(manifestEntries.map((r) => r.source)).toEqual([
      "/news/*",
      "/gallery?a=1",
    ])
  })

  it("returns empty arrays when all rows are exact", () => {
    const { exact, manifestEntries } = partitionRedirects([
      { source: "/a", destination: "/b" },
    ])
    expect(exact).toHaveLength(1)
    expect(manifestEntries).toHaveLength(0)
  })

  it("returns empty arrays when input is empty", () => {
    const { exact, manifestEntries } = partitionRedirects([])
    expect(exact).toHaveLength(0)
    expect(manifestEntries).toHaveLength(0)
  })
})

describe("buildManifest", () => {
  it("produces a versioned flat map keyed by source", () => {
    expect(
      buildManifest([
        { source: "/news/*", destination: "/newsroom" },
        { source: "/gallery?a=1", destination: "https://x.gov.sg/g" },
      ]),
    ).toEqual({
      version: 1,
      redirects: {
        "/news/*": "/newsroom",
        "/gallery?a=1": "https://x.gov.sg/g",
      },
    })
  })

  it("returns an empty redirects map for an empty input", () => {
    expect(buildManifest([])).toEqual({ version: 1, redirects: {} })
  })
})
