import { describe, expect, it } from "vitest"

import { isManagedSiteAsset } from "../isManagedSiteAsset"

const SITE_ID = 42

describe("isManagedSiteAsset", () => {
  it("accepts a managed site-storage asset for this site", () => {
    expect(isManagedSiteAsset("/42/images/photo.jpg", SITE_ID)).toBe(true)
  })

  // The reason this predicate exists: a freshly-added block carries the
  // placeholder src, which starts with "/" but is NOT a site asset — it must
  // never offer "Adjust image".
  it("rejects the built-in placeholder image", () => {
    expect(isManagedSiteAsset("/placeholder_no_image.png", SITE_ID)).toBe(false)
  })

  it("rejects external/absolute URLs", () => {
    expect(isManagedSiteAsset("https://example.com/photo.jpg", SITE_ID)).toBe(
      false,
    )
  })

  it("rejects an asset belonging to a different site", () => {
    expect(isManagedSiteAsset("/99/images/photo.jpg", SITE_ID)).toBe(false)
  })

  it("rejects empty/undefined src", () => {
    expect(isManagedSiteAsset(undefined, SITE_ID)).toBe(false)
    expect(isManagedSiteAsset("", SITE_ID)).toBe(false)
  })
})
