import { describe, expect, it } from "vitest"

import { isManagedSiteAsset } from "../isManagedSiteAsset"

const SITE_ID = 42
const UUID = "abcd1234-ab12-cd34-ef56-abcdef123456"

describe("isManagedSiteAsset", () => {
  it("accepts a managed site-storage asset for this site", () => {
    expect(
      isManagedSiteAsset(
        `/${SITE_ID}/${UUID}/grandma_knitting_icon.png`,
        SITE_ID,
      ),
    ).toBe(true)
  })

  // A real upload that happens to be named placeholder_no_image.png still lives
  // under a canonical storage path, so it stays adjustable.
  it("accepts a real asset whose filename matches the placeholder", () => {
    expect(
      isManagedSiteAsset(
        `/${SITE_ID}/${UUID}/placeholder_no_image.png`,
        SITE_ID,
      ),
    ).toBe(true)
  })

  // The reason this predicate exists: a freshly-added block carries the
  // placeholder src, which starts with "/" but has no storage key — it must
  // never offer "Adjust image".
  it("rejects the built-in placeholder image", () => {
    expect(isManagedSiteAsset("/placeholder_no_image.png", SITE_ID)).toBe(false)
  })

  // The server's deriveBakeKey throws unless the key folder starts with
  // `${siteId}/`, so another site's asset can never be baked here.
  it("rejects another site's asset", () => {
    expect(isManagedSiteAsset(`/99/${UUID}/photo.png`, SITE_ID)).toBe(false)
  })

  // Legacy/migrated or hand-authored root-relative paths have no uuid folder,
  // so parseAssetUrlToKey returns null and the save fails.
  it("rejects root-relative legacy paths", () => {
    expect(isManagedSiteAsset("/images/foo.jpg", SITE_ID)).toBe(false)
  })

  it("rejects protocol-relative URLs", () => {
    expect(isManagedSiteAsset("//evil.example.com/photo.jpg", SITE_ID)).toBe(
      false,
    )
  })

  it("rejects external/absolute URLs", () => {
    expect(isManagedSiteAsset("https://example.com/photo.jpg", SITE_ID)).toBe(
      false,
    )
  })

  // A nested path beyond `${siteId}/${uuid}/${file}` is not a canonical key.
  it("rejects paths with extra nested segments", () => {
    expect(
      isManagedSiteAsset(`/${SITE_ID}/${UUID}/sub/photo.png`, SITE_ID),
    ).toBe(false)
  })

  it("rejects empty/undefined src", () => {
    expect(isManagedSiteAsset(undefined, SITE_ID)).toBe(false)
    expect(isManagedSiteAsset("", SITE_ID)).toBe(false)
  })
})
