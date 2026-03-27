import path from "node:path"
import { describe, expect, it } from "vitest"

import { getSchemaPath, INDEX_PAGE_PERMALINK } from "../schema"

const schemaDir = "/fake/schema"

describe("getSchemaPath", () => {
  it("returns schemaDir/_index.json for root permalink", () => {
    expect(getSchemaPath("/", schemaDir)).toBe(
      path.join(schemaDir, "_index.json"),
    )
  })

  it("returns schemaDir/segment.json for single segment", () => {
    expect(getSchemaPath("/contact", schemaDir)).toBe(
      path.join(schemaDir, "contact.json"),
    )
  })

  it("returns schemaDir/a/b.json for nested permalink", () => {
    expect(getSchemaPath("/foo/bar", schemaDir)).toBe(
      path.join(schemaDir, "foo", "bar.json"),
    )
  })

  it("uses custom index name when provided", () => {
    expect(getSchemaPath("/", schemaDir, "index")).toBe(
      path.join(schemaDir, "index.json"),
    )
  })

  it("throws on path traversal segments (..)", () => {
    expect(() => getSchemaPath("/foo/../etc", schemaDir)).toThrow(
      'Invalid schema permalink path segments: "/foo/../etc"',
    )
    expect(() => getSchemaPath("/..", schemaDir)).toThrow(
      'Invalid schema permalink path segments: "/.."',
    )
  })

  it("throws on current-dir segments (.)", () => {
    expect(() => getSchemaPath("/./foo", schemaDir)).toThrow(
      'Invalid schema permalink path segments: "/./foo"',
    )
    expect(() => getSchemaPath("/.", schemaDir)).toThrow(
      'Invalid schema permalink path segments: "/."',
    )
  })

  it("throws on empty or invalid segments", () => {
    expect(() => getSchemaPath("/foo//bar", schemaDir)).toThrow(
      'Invalid schema permalink path segments: "/foo//bar"',
    )
  })
})

describe("INDEX_PAGE_PERMALINK", () => {
  it("is _index", () => {
    expect(INDEX_PAGE_PERMALINK).toBe("_index")
  })
})
