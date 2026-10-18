import { describe, expect, it } from "vitest"
import { resolveManagedAssetUrl } from "~/utils/resolveManagedAssetUrl"

const BASE = "https://assets.example.com"

describe("resolveManagedAssetUrl", () => {
  it("resolves a relative src against assetsBaseUrl", () => {
    expect(resolveManagedAssetUrl("/image.png", BASE, false)).toBe(
      `${BASE}/image.png`,
    )
  })

  it("appends original=true with '?' when the src has no query string", () => {
    expect(resolveManagedAssetUrl("/image.png", BASE, true)).toBe(
      `${BASE}/image.png?original=true`,
    )
  })

  it("appends original=true with '&' when the src already has a query string", () => {
    expect(resolveManagedAssetUrl("/image.png?version=2", BASE, true)).toBe(
      `${BASE}/image.png?version=2&original=true`,
    )
  })

  it("does not append original=true on the published site", () => {
    expect(resolveManagedAssetUrl("/image.png?version=2", BASE, false)).toBe(
      `${BASE}/image.png?version=2`,
    )
  })

  it("passes external URLs through unchanged", () => {
    expect(
      resolveManagedAssetUrl("https://cdn.other.com/a.png", BASE, true),
    ).toBe("https://cdn.other.com/a.png")
  })

  it("passes the src through unchanged when assetsBaseUrl is undefined", () => {
    expect(resolveManagedAssetUrl("/image.png", undefined, true)).toBe(
      "/image.png",
    )
  })
})
