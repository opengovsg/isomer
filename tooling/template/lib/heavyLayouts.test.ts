import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { run as generateLayoutRoutes } from "../scripts/generate-layout-routes.mjs"
import {
  getHeavyLayoutRoutes,
  HEAVY_LAYOUTS as MjsHeavyLayouts,
  normalizePermalink as mjsNormalize,
} from "../scripts/utils/heavyLayouts.mjs"
import heavyLayoutTypesJson from "./heavy-layout-types.json"
import {
  excludeHeavyFromCatchAllUrls,
  getHeavyNormalizedPermalinks,
  HEAVY_LAYOUTS as TsHeavyLayouts,
  normalizePermalink as tsNormalize,
} from "./heavyLayouts"

const SAMPLE_SITEMAP = {
  permalink: "/",
  layout: "homepage",
  children: [
    {
      permalink: "/news",
      layout: "collection",
      children: [
        { permalink: "/news/post-a", layout: "article" },
        { permalink: "/news/post-b", layout: "article" },
      ],
    },
    { permalink: "/about", layout: "content" },
    { permalink: "/search", layout: "search" },
    { permalink: "/data/registry", layout: "database" },
  ],
}

describe("heavy-layout-types.json", () => {
  it("is the single source of truth for HEAVY_LAYOUTS in both .ts and .mjs", () => {
    // Arrange / Act / Assert
    expect([...TsHeavyLayouts].sort()).toEqual([...heavyLayoutTypesJson].sort())
    expect([...MjsHeavyLayouts].sort()).toEqual(
      [...heavyLayoutTypesJson].sort(),
    )
    expect([...TsHeavyLayouts].sort()).toEqual([
      "collection",
      "database",
      "search",
    ])
  })
})

describe("heavyLayouts (.ts catch-all helpers)", () => {
  it("normalizes leading and trailing slashes", () => {
    // Arrange / Act / Assert
    expect(tsNormalize("/news/")).toBe("news")
    expect(tsNormalize("/folder/news")).toBe("folder/news")
    expect(tsNormalize("/")).toBe("")
  })

  it("getHeavyNormalizedPermalinks matches codegen route set", () => {
    // Arrange / Act
    const fromTs = [...getHeavyNormalizedPermalinks(SAMPLE_SITEMAP)].sort()
    const fromMjs = getHeavyLayoutRoutes(SAMPLE_SITEMAP)
      .map((r) => r.normalized)
      .sort()

    // Assert — catch-all exclusion and codegen must agree or static export double-emits
    expect(fromTs).toEqual(fromMjs)
    expect(fromTs).toEqual(["data/registry", "news", "search"])
  })

  it("excludeHeavyFromCatchAllUrls drops landings but keeps article children", () => {
    // Arrange
    const urls = [
      "/",
      "/about/",
      "/news/",
      "/news/post-a/",
      "/news/post-b",
      "/search",
      "/data/registry/",
    ]

    // Act
    const kept = excludeHeavyFromCatchAllUrls(urls, SAMPLE_SITEMAP)

    // Assert
    expect(kept.sort()).toEqual(
      ["", "about", "news/post-a", "news/post-b"].sort(),
    )
  })
})

describe("heavyLayouts (.mjs codegen helpers)", () => {
  it("normalizes the same way as the .ts helper", () => {
    // Arrange / Act / Assert
    expect(mjsNormalize("/news/")).toBe(tsNormalize("/news/"))
    expect(mjsNormalize("/")).toBe(tsNormalize("/"))
  })

  it("collects only collection, search, and database landings", () => {
    // Arrange / Act
    const routes = getHeavyLayoutRoutes(SAMPLE_SITEMAP)

    // Assert
    expect(routes.map((r) => r.normalized).sort()).toEqual([
      "data/registry",
      "news",
      "search",
    ])
    expect(routes.every((r) => MjsHeavyLayouts.has(r.layout))).toBe(true)
    expect(routes.some((r) => r.normalized.startsWith("news/"))).toBe(false)
  })
})

describe("generate-layout-routes", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "heavy-routes-"))
    fs.mkdirSync(path.join(tmpDir, "app"), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("writes exact landing page.tsx files under app/(heavy)/", () => {
    // Arrange
    fs.writeFileSync(
      path.join(tmpDir, "sitemap.json"),
      JSON.stringify({
        permalink: "/",
        layout: "homepage",
        children: [
          {
            permalink: "/news",
            layout: "collection",
            children: [{ permalink: "/news/a", layout: "article" }],
          },
          { permalink: "/search", layout: "search" },
        ],
      }),
    )

    // Act
    const { written } = generateLayoutRoutes(tmpDir)

    // Assert
    expect(written.sort()).toEqual([
      path.join("app", "(heavy)", "news", "page.tsx"),
      path.join("app", "(heavy)", "search", "page.tsx"),
    ])
    expect(
      fs.existsSync(path.join(tmpDir, "app", "(heavy)", "news", "page.tsx")),
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(tmpDir, "app", "(heavy)", "news", "a", "page.tsx"),
      ),
    ).toBe(false)

    const source = fs.readFileSync(
      path.join(tmpDir, "app", "(heavy)", "news", "page.tsx"),
      "utf8",
    )
    expect(source).toContain('makeCollectionPage("news")')
    expect(source).toContain("@/render/makeCollectionPage")
    expect(source).toContain("layout: collection")

    const searchSource = fs.readFileSync(
      path.join(tmpDir, "app", "(heavy)", "search", "page.tsx"),
      "utf8",
    )
    expect(searchSource).toContain('makeSearchPage("search")')
    expect(searchSource).toContain("@/render/makeSearchPage")
    expect(searchSource).not.toContain("makeCollectionPage")
  })

  it("clears previous generated routes on re-run", () => {
    // Arrange
    fs.writeFileSync(
      path.join(tmpDir, "sitemap.json"),
      JSON.stringify({
        permalink: "/",
        layout: "homepage",
        children: [{ permalink: "/news", layout: "collection" }],
      }),
    )
    generateLayoutRoutes(tmpDir)

    fs.writeFileSync(
      path.join(tmpDir, "sitemap.json"),
      JSON.stringify({
        permalink: "/",
        layout: "homepage",
        children: [{ permalink: "/search", layout: "search" }],
      }),
    )

    // Act
    const { written } = generateLayoutRoutes(tmpDir)

    // Assert
    expect(written).toEqual([path.join("app", "(heavy)", "search", "page.tsx")])
    expect(
      fs.existsSync(path.join(tmpDir, "app", "(heavy)", "news", "page.tsx")),
    ).toBe(false)
  })

  it("emits nothing when the sitemap has no heavy layouts", () => {
    // Arrange
    fs.writeFileSync(
      path.join(tmpDir, "sitemap.json"),
      JSON.stringify({
        permalink: "/",
        layout: "homepage",
        children: [{ permalink: "/about", layout: "content" }],
      }),
    )

    // Act
    const { written } = generateLayoutRoutes(tmpDir)

    // Assert
    expect(written).toEqual([])
    expect(fs.existsSync(path.join(tmpDir, "app", "(heavy)"))).toBe(false)
  })
})
