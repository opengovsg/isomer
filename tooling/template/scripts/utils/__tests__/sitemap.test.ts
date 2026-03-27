import { describe, expect, it } from "vitest"

import type { SitemapNode } from "../sitemap"
import {
  extractPages,
  extractPermalinks,
  permalinkToTargetPath,
} from "../sitemap"

describe("extractPermalinks", () => {
  it("returns permalinks excluding file and link layouts", () => {
    const node: SitemapNode = {
      permalink: "/",
      layout: "homepage",
      children: [
        { permalink: "/contact", layout: "content" },
        { permalink: "/pdf", layout: "file" },
        { permalink: "/external", layout: "link" },
        {
          permalink: "/nested",
          layout: "index",
          children: [{ permalink: "/nested/child", layout: "content" }],
        },
      ],
    }
    expect(extractPermalinks(node)).toEqual([
      "/",
      "/contact",
      "/nested",
      "/nested/child",
    ])
  })

  it("returns empty array for node without permalink", () => {
    const node: SitemapNode = { children: [] }
    expect(extractPermalinks(node)).toEqual([])
  })

  it("mutates and returns provided array", () => {
    const node: SitemapNode = { permalink: "/", layout: "homepage" }
    const out: string[] = []
    expect(extractPermalinks(node, out)).toBe(out)
    expect(out).toEqual(["/"])
  })
})

describe("extractPages", () => {
  it("returns all pages with permalink and layout", () => {
    const node: SitemapNode = {
      permalink: "/",
      layout: "homepage",
      children: [
        { permalink: "/about", layout: "content" },
        { permalink: "/file", layout: "file" },
      ],
    }
    expect(extractPages(node)).toEqual([
      { permalink: "/", layout: "homepage" },
      { permalink: "/about", layout: "content" },
      { permalink: "/file", layout: "file" },
    ])
  })

  it("uses empty string for missing layout", () => {
    const node: SitemapNode = { permalink: "/no-layout" }
    expect(extractPages(node)).toEqual([
      { permalink: "/no-layout", layout: "" },
    ])
  })
})

describe("permalinkToTargetPath", () => {
  const appDir = "/app"

  it("maps root permalink to appDir and appDir/page.tsx", () => {
    expect(permalinkToTargetPath("/", appDir)).toEqual({
      targetDir: "/app",
      targetFile: "/app/page.tsx",
    })
  })

  it("maps single segment to appDir/segment/page.tsx", () => {
    expect(permalinkToTargetPath("/contact", appDir)).toEqual({
      targetDir: "/app/contact",
      targetFile: "/app/contact/page.tsx",
    })
  })

  it("maps nested permalink to nested dirs", () => {
    expect(
      permalinkToTargetPath("/the-president/former-presidents", appDir),
    ).toEqual({
      targetDir: "/app/the-president/former-presidents",
      targetFile: "/app/the-president/former-presidents/page.tsx",
    })
  })

  it("throws on path traversal segments (..)", () => {
    expect(() => permalinkToTargetPath("/foo/../etc", appDir)).toThrow(
      'Invalid permalink path segments: "/foo/../etc"',
    )
    expect(() => permalinkToTargetPath("/..", appDir)).toThrow(
      'Invalid permalink path segments: "/.."',
    )
  })

  it("throws on current-dir segments (.)", () => {
    expect(() => permalinkToTargetPath("/./foo", appDir)).toThrow(
      'Invalid permalink path segments: "/./foo"',
    )
    expect(() => permalinkToTargetPath("/.", appDir)).toThrow(
      'Invalid permalink path segments: "/."',
    )
  })

  it("throws on empty or invalid segments", () => {
    expect(() => permalinkToTargetPath("/foo//bar", appDir)).toThrow(
      'Invalid permalink path segments: "/foo//bar"',
    )
  })
})
