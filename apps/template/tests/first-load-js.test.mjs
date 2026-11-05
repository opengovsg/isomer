import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  htmlForPage,
  referencedJsUrls,
  scoreExport,
} from "../scripts/first-load-js.mjs"

const dirs = []

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    spawnSync("rm", ["-rf", dir])
  }
})

const writePage = (out, page, html) => {
  const file = htmlForPage(out, page)
  mkdirSync(join(file, ".."), { recursive: true })
  writeFileSync(file, html)
}

describe("referencedJsUrls", () => {
  it("keeps script src, modulepreload, and preload-as-script once each", () => {
    // Arrange
    const html = `
      <script src="/_next/static/chunks/a.js"></script>
      <link rel="modulepreload" href="/_next/static/chunks/a.js" />
      <link rel="preload" as="script" href="/_next/static/chunks/b.js" />
      <link href="/_next/static/chunks/c.js" rel="modulepreload" />
      <link rel="preload" href="/_next/static/css/x.css" as="style" />
      <link rel="stylesheet" href="/_next/static/css/x.css" />
      <script type="application/ld+json">{"@type":"WebPage"}</script>
      <script src="https://example.com/remote.js"></script>
    `

    // Act
    const urls = referencedJsUrls(html)

    // Assert
    expect(urls).toEqual([
      "/_next/static/chunks/a.js",
      "/_next/static/chunks/b.js",
      "/_next/static/chunks/c.js",
    ])
  })
})

describe("scoreExport", () => {
  it("sums gzip -c bytes of the JS that page references and ignores the rest", () => {
    // Arrange
    const out = mkdtempSync(join(tmpdir(), "first-load-"))
    dirs.push(out)
    const shared = join(out, "_next/static/chunks/shared.js")
    const onlyAbout = join(out, "_next/static/chunks/about.js")
    const unused = join(out, "_next/static/chunks/unused.js")
    mkdirSync(join(out, "_next/static/chunks"), { recursive: true })
    writeFileSync(shared, "shared-chunk")
    writeFileSync(onlyAbout, "about-only-chunk")
    writeFileSync(unused, "not-referenced-by-any-page")
    const home = `<script src="/_next/static/chunks/shared.js"></script>
      <link rel="preload" href="/_next/static/chunks/shared.js" as="script" />`
    const about = `<script src="/_next/static/chunks/shared.js"></script>
      <link rel="modulepreload" href="/_next/static/chunks/about.js" />`
    for (const page of [
      "/",
      "/news",
      "/news/post-a",
      "/search",
      "/data/registry",
    ]) {
      writePage(out, page, home)
    }
    writePage(out, "/about", about)
    const gzip = (file) => spawnSync("gzip", ["-c", file]).stdout.length

    // Act
    const pages = scoreExport(out, "searchSG")

    // Assert
    expect(pages.find((row) => row.page === "/")?.bytes).toBe(gzip(shared))
    expect(pages.find((row) => row.page === "/about")?.bytes).toBe(
      gzip(shared) + gzip(onlyAbout),
    )
    expect(pages.every((row) => row.searchType === "searchSG")).toBe(true)
    expect(pages.map((row) => row.page)).toEqual([
      "/",
      "/about",
      "/news",
      "/news/post-a",
      "/search",
      "/data/registry",
    ])
  })

  it("decodes percent-encoded chunk paths onto the files Next writes", () => {
    // Arrange
    const out = mkdtempSync(join(tmpdir(), "first-load-encoded-"))
    dirs.push(out)
    const pageJs = join(out, "_next/static/chunks/app/[[...permalink]]/page.js")
    mkdirSync(join(pageJs, ".."), { recursive: true })
    writeFileSync(pageJs, "page-chunk")
    const html = `<script src="/_next/static/chunks/app/%5B%5B...permalink%5D%5D/page.js"></script>`
    for (const page of [
      "/",
      "/about",
      "/news",
      "/news/post-a",
      "/search",
      "/data/registry",
    ]) {
      writePage(out, page, html)
    }

    // Act
    const pages = scoreExport(out, "searchSG")

    // Assert
    const gzip = spawnSync("gzip", ["-c", pageJs]).stdout.length
    expect(pages.every((row) => row.bytes === gzip)).toBe(true)
  })

  it("fails when a measured page was not exported", () => {
    // Arrange
    const out = mkdtempSync(join(tmpdir(), "first-load-missing-"))
    dirs.push(out)

    // Act / Assert
    expect(() => scoreExport(out, "searchSG")).toThrow(/Missing exported HTML/)
  })
})
