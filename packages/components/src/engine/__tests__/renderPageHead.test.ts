import { describe, expect, it } from "vitest"

import { resolveMetadataUrl } from "../renderPageHead"

const base = new URL("https://www.example.gov.sg")

describe("resolveMetadataUrl", () => {
  it("keeps absolute URLs", () => {
    expect(resolveMetadataUrl("https://cdn.example.com/a.png", base)).toBe(
      "https://cdn.example.com/a.png",
    )
  })

  it("resolves paths against the site URL, like Next's metadata API", () => {
    expect(resolveMetadataUrl("/images/a.png", base)).toBe(
      "https://www.example.gov.sg/images/a.png",
    )
    expect(resolveMetadataUrl("images/a.png", base)).toBe(
      "https://www.example.gov.sg/images/a.png",
    )
    // `new URL("//x", base)` would read "x" as a host (or throw); Next joins it as a path.
    expect(resolveMetadataUrl("//images/a.png", base)).toBe(
      "https://www.example.gov.sg/images/a.png",
    )
  })

  it("handles an image src without a leading slash glued onto the assets URL", () => {
    // Real content: page.image.src = "SHBC (BP-NR-05) Lydia .png". getMetadata() prefixes the
    // assets base URL, so the filename ends up in the hostname, which new URL() rejects.
    // Next joins it as a path onto the site URL instead of throwing; so do we.
    expect(
      resolveMetadataUrl(
        "https://assets.example.gov.sgSHBC (BP-NR-05) Lydia .png",
        base,
      ),
    ).toBe(
      "https://www.example.gov.sg/https:/assets.example.gov.sgSHBC%20(BP-NR-05)%20Lydia%20.png",
    )
  })

  it("never throws on malformed values", () => {
    for (const value of [
      "//",
      "https://",
      "http://bad host/a.png",
      "[resource:1:2]",
    ])
      expect(() => resolveMetadataUrl(value, base)).not.toThrow()
  })

  it("passes values through when there's no site URL", () => {
    expect(resolveMetadataUrl("/a.png", undefined)).toBe("/a.png")
    expect(resolveMetadataUrl(undefined, base)).toBeUndefined()
  })
})
