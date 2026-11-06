import { describe, expect, it } from "vitest"
import { resolveManagedAssetUrl } from "~/utils/resolveManagedAssetUrl"

const BASE = "https://assets.example.com"

describe("resolveManagedAssetUrl", () => {
  it("resolves a relative src against assetsBaseUrl", () => {
    expect(resolveManagedAssetUrl("/image.png", BASE)).toBe(`${BASE}/image.png`)
  })

  it("preserves an existing query string", () => {
    expect(resolveManagedAssetUrl("/image.png?version=2", BASE)).toBe(
      `${BASE}/image.png?version=2`,
    )
  })

  it("passes external URLs through unchanged", () => {
    expect(resolveManagedAssetUrl("https://cdn.other.com/a.png", BASE)).toBe(
      "https://cdn.other.com/a.png",
    )
  })

  it("passes the src through unchanged when assetsBaseUrl is undefined", () => {
    expect(resolveManagedAssetUrl("/image.png", undefined)).toBe("/image.png")
  })
})
