import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getHeavyLayoutRoutes,
  HEAVY_LAYOUTS,
  normalizePermalink,
} from "../scripts/utils/heavyLayouts.mjs"
import { run as generateLayoutRoutes } from "../scripts/generate-layout-routes.mjs"

describe("heavyLayouts", () => {
  it("normalizes leading and trailing slashes", () => {
    // Arrange / Act / Assert
    expect(normalizePermalink("/news/")).toBe("news")
    expect(normalizePermalink("/folder/news")).toBe("folder/news")
    expect(normalizePermalink("/")).toBe("")
  })

  it("collects only collection, search, and database landings", () => {
    // Arrange
    const sitemap = {
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

    // Act
    const routes = getHeavyLayoutRoutes(sitemap)

    // Assert
    expect(routes.map((r) => r.normalized).sort()).toEqual([
      "data/registry",
      "news",
      "search",
    ])
    expect(routes.every((r) => HEAVY_LAYOUTS.has(r.layout))).toBe(true)
    // Article children under a collection must NOT be heavy routes
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
    expect(source).toContain('makeHeavyPage("news")')
    expect(source).toContain("layout: collection")
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
})
