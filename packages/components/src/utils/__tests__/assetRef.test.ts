import { describe, expect, it } from "vitest"

import { buildNewAssetKey, parseAssetRef, rewriteAssetRef } from "../assetRef"

const SITE_ID = 1
const VALID_UUID = "dc2b609a-355e-406c-af6c-003683731e7e"
const VALID_KEY = `${SITE_ID}/${VALID_UUID}/report.pdf`

describe("parseAssetRef", () => {
  it("should parse a valid reference with a leading slash", () => {
    expect(parseAssetRef(`/${VALID_KEY}`, SITE_ID)).toBe(VALID_KEY)
  })

  it("should parse a valid reference without a leading slash", () => {
    expect(parseAssetRef(VALID_KEY, SITE_ID)).toBe(VALID_KEY)
  })

  it("should parse a valid reference with a nested filename path", () => {
    const nestedKey = `${SITE_ID}/${VALID_UUID}/subdir/file.docx`
    expect(parseAssetRef(`/${nestedKey}`, SITE_ID)).toBe(nestedKey)
    expect(parseAssetRef(nestedKey, SITE_ID)).toBe(nestedKey)
  })

  it("should return null for a different siteId", () => {
    expect(parseAssetRef(`/${VALID_KEY}`, 2)).toBeNull()
    expect(parseAssetRef(VALID_KEY, 2)).toBeNull()
  })

  it("should return null for an external https URL", () => {
    expect(parseAssetRef("https://example.com/file.pdf", SITE_ID)).toBeNull()
  })

  it("should return null for a mailto: link", () => {
    expect(parseAssetRef("mailto:a@b.com", SITE_ID)).toBeNull()
  })

  it("should return null for a page reference", () => {
    expect(parseAssetRef("[resource:1:2]", SITE_ID)).toBeNull()
  })

  it("should return null for plain text", () => {
    expect(parseAssetRef("just plain text", SITE_ID)).toBeNull()
  })

  it("should return null when the filename segment is missing", () => {
    // Only siteId/uuid — no trailing filename
    expect(parseAssetRef(`${SITE_ID}/${VALID_UUID}`, SITE_ID)).toBeNull()
    expect(parseAssetRef(`/${SITE_ID}/${VALID_UUID}/`, SITE_ID)).toBeNull()
  })

  it("should return null for a bad uuid", () => {
    expect(
      parseAssetRef(`${SITE_ID}/not-a-valid-uuid/report.pdf`, SITE_ID),
    ).toBeNull()
    expect(
      parseAssetRef(
        `${SITE_ID}/dc2b609a-355e-406c-af6c/report.pdf`,
        SITE_ID,
      ),
    ).toBeNull()
  })

  it("should handle trimming of surrounding whitespace", () => {
    expect(parseAssetRef(`  /${VALID_KEY}  `, SITE_ID)).toBe(VALID_KEY)
  })
})

describe("buildNewAssetKey", () => {
  it("should return a key with the same siteId and filename but a different uuid", () => {
    const newKey = buildNewAssetKey(SITE_ID, VALID_KEY)

    // Same siteId prefix
    expect(newKey.startsWith(`${SITE_ID}/`)).toBe(true)

    // Same filename suffix
    expect(newKey.endsWith("/report.pdf")).toBe(true)

    // Different uuid
    const oldUuid = VALID_KEY.split("/")[1]
    const newUuid = newKey.split("/")[1]
    expect(newUuid).not.toBe(oldUuid)
  })

  it("should produce a key that round-trips through parseAssetRef", () => {
    const newKey = buildNewAssetKey(SITE_ID, VALID_KEY)
    expect(parseAssetRef(newKey, SITE_ID)).toBe(newKey)
  })

  it("should throw when the key belongs to a different siteId", () => {
    expect(() => buildNewAssetKey(2, VALID_KEY)).toThrow()
  })

  it("should preserve nested filename paths", () => {
    const nestedKey = `${SITE_ID}/${VALID_UUID}/subdir/document.pdf`
    const newKey = buildNewAssetKey(SITE_ID, nestedKey)
    expect(newKey.endsWith("/subdir/document.pdf")).toBe(true)
  })
})

describe("rewriteAssetRef", () => {
  const NEW_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  const NEW_KEY = `${SITE_ID}/${NEW_UUID}/report.pdf`

  it("should return the new key WITH a leading slash when the original had one", () => {
    const map = new Map([[VALID_KEY, NEW_KEY]])
    expect(rewriteAssetRef(`/${VALID_KEY}`, map, SITE_ID)).toBe(`/${NEW_KEY}`)
  })

  it("should return the new key WITHOUT a leading slash when the original had none", () => {
    const map = new Map([[VALID_KEY, NEW_KEY]])
    expect(rewriteAssetRef(VALID_KEY, map, SITE_ID)).toBe(NEW_KEY)
  })

  it("should return the value unchanged when the key is not in the map", () => {
    const map = new Map<string, string>()
    expect(rewriteAssetRef(`/${VALID_KEY}`, map, SITE_ID)).toBe(`/${VALID_KEY}`)
  })

  it("should return a non-asset value unchanged", () => {
    const map = new Map([[VALID_KEY, NEW_KEY]])
    expect(rewriteAssetRef("https://example.com", map, SITE_ID)).toBe(
      "https://example.com",
    )
  })

  it("should return a page reference unchanged", () => {
    const map = new Map([[VALID_KEY, NEW_KEY]])
    expect(rewriteAssetRef("[resource:1:2]", map, SITE_ID)).toBe(
      "[resource:1:2]",
    )
  })
})
