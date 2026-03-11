import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { run as runAnalyzeSitemap } from "../analyze-sitemap"
import { run as runGeneratePages } from "../generate-pages"
import { run as runUpdatePages } from "../update-pages"

const FIXTURE = path.join(__dirname, "fixtures", "workflow")

describe("build:prepare workflow (regression)", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "template-workflow-"))
    await copyDir(path.join(FIXTURE, "public"), path.join(tmpDir, "public"))
    await copyDir(path.join(FIXTURE, "schema"), path.join(tmpDir, "schema"))
    await fs.mkdir(path.join(tmpDir, "app"), { recursive: true })
    await fs.copyFile(
      path.join(FIXTURE, "app", "page.tsx"),
      path.join(tmpDir, "app", "page.tsx"),
    )
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it("analyze-sitemap → generate-pages → update-pages produces expected outputs", async () => {
    await runAnalyzeSitemap(tmpDir)
    await runGeneratePages(tmpDir)
    await runUpdatePages(tmpDir)

    const analysisPath = path.join(tmpDir, "sitemap-analysis.json")
    const analysis = JSON.parse(await fs.readFile(analysisPath, "utf8"))

    // --- 1. sitemap-analysis: all routes with correct layout and components ---
    expect(analysis["/"]).toEqual({
      layout: "homepage",
      components: ["hero"],
    })
    expect(analysis["/about"]).toEqual({
      layout: "content",
      components: ["prose"],
    })
    expect(analysis["/about/team"]).toEqual({
      layout: "content",
      components: ["prose", "image"],
    })
    expect(analysis["/news"]).toEqual({
      layout: "index",
      components: ["hero", "childrenpages"],
    })
    // file layout: no schema, but still in analysis from sitemap
    expect(analysis["/pdf"]).toEqual({
      layout: "file",
      components: [],
    })

    // --- 2. Page files: only for non-file/link routes (no /pdf page) ---
    const rootPage = path.join(tmpDir, "app", "page.tsx")
    const aboutPage = path.join(tmpDir, "app", "about", "page.tsx")
    const teamPage = path.join(tmpDir, "app", "about", "team", "page.tsx")
    const newsPage = path.join(tmpDir, "app", "news", "page.tsx")
    const pdfPage = path.join(tmpDir, "app", "pdf", "page.tsx")

    await expect(fs.access(rootPage)).resolves.toBeUndefined()
    await expect(fs.access(aboutPage)).resolves.toBeUndefined()
    await expect(fs.access(teamPage)).resolves.toBeUndefined()
    await expect(fs.access(newsPage)).resolves.toBeUndefined()
    await expect(fs.access(pdfPage)).rejects.toThrow()

    // --- 3. STATIC_ROUTE_PERMALINK per page ---
    const rootContent = await fs.readFile(rootPage, "utf8")
    const aboutContent = await fs.readFile(aboutPage, "utf8")
    const teamContent = await fs.readFile(teamPage, "utf8")
    const newsContent = await fs.readFile(newsPage, "utf8")

    expect(rootContent).toMatch(/STATIC_ROUTE_PERMALINK[^\n]*\[\s*\]/)
    expect(aboutContent).toContain('["about"]')
    expect(teamContent).toContain('["about", "team"]')
    expect(newsContent).toContain('["news"]')

    // --- 4. Layout switch pruned per page (only the layout for that route kept) ---
    expect(rootContent).toMatch(/case "homepage"/)
    expect(rootContent).not.toMatch(/case "content"/)
    expect(rootContent).not.toMatch(/case "index"/)

    expect(aboutContent).toMatch(/case "content"/)
    expect(aboutContent).not.toMatch(/case "homepage"/)
    expect(aboutContent).not.toMatch(/case "index"/)

    expect(teamContent).toMatch(/case "content"/)
    expect(teamContent).not.toMatch(/case "homepage"/)

    expect(newsContent).toMatch(/case "index"/)
    expect(newsContent).not.toMatch(/case "homepage"/)
    expect(newsContent).not.toMatch(/case "content"/)

    // --- 5. Component switch pruned per page ---
    expect(rootContent).toMatch(/case "hero"/)
    expect(rootContent).not.toMatch(/case "prose"/)
    expect(rootContent).not.toMatch(/case "image"/)
    expect(rootContent).not.toMatch(/case "childrenpages"/)

    expect(aboutContent).toMatch(/case "prose"/)
    expect(aboutContent).not.toMatch(/case "hero"/)
    expect(aboutContent).not.toMatch(/case "image"/)

    expect(teamContent).toMatch(/case "prose"/)
    expect(teamContent).toMatch(/case "image"/)
    expect(teamContent).not.toMatch(/case "hero"/)
    expect(teamContent).not.toMatch(/case "childrenpages"/)

    expect(newsContent).toMatch(/case "hero"/)
    expect(newsContent).toMatch(/case "childrenpages"/)
    expect(newsContent).not.toMatch(/case "prose"/)
    expect(newsContent).not.toMatch(/case "image"/)
  })
})

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) await copyDir(s, d)
    else await fs.copyFile(s, d)
  }
}
