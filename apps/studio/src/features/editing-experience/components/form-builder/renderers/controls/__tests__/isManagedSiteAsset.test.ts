import { describe, expect, it } from "vitest"

import { isManagedSiteAsset } from "../isManagedSiteAsset"

describe("isManagedSiteAsset", () => {
  it("accepts a managed site-storage asset (relative path)", () => {
    expect(isManagedSiteAsset("/42/abc-uuid/grandma_knitting_icon.png")).toBe(
      true,
    )
  })

  // The reason this predicate exists: a freshly-added block carries the
  // placeholder src, which starts with "/" but is NOT a real asset — it must
  // never offer "Adjust image".
  it("rejects the built-in placeholder image", () => {
    expect(isManagedSiteAsset("/placeholder_no_image.png")).toBe(false)
  })

  // A real upload that happens to be named placeholder_no_image.png still lives
  // under a storage path, so it is NOT the placeholder and stays adjustable.
  it("accepts a real asset whose filename matches the placeholder", () => {
    expect(isManagedSiteAsset("/42/abc-uuid/placeholder_no_image.png")).toBe(
      true,
    )
  })

  it("rejects external/absolute URLs", () => {
    expect(isManagedSiteAsset("https://example.com/photo.jpg")).toBe(false)
  })

  it("rejects empty/undefined src", () => {
    expect(isManagedSiteAsset(undefined)).toBe(false)
    expect(isManagedSiteAsset("")).toBe(false)
  })
})
