import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { run as runAnalyzeSitemap } from "../analyze-sitemap"
import { run as runGeneratePage } from "../generate-page"

const FIXTURE = path.join(__dirname, "fixtures", "workflow")
const TEMPLATE_CATCH_ALL_PAGE = path.join(
  __dirname,
  "..",
  "..",
  "app",
  "[[...permalink]]",
  "page.tsx",
)

describe("build:prepare workflow (regression)", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "template-workflow-"))
    await copyDir(path.join(FIXTURE, "public"), path.join(tmpDir, "public"))
    await copyDir(path.join(FIXTURE, "schema"), path.join(tmpDir, "schema"))
    await fs.mkdir(path.join(tmpDir, "app", "[[...permalink]]"), {
      recursive: true,
    })
    await fs.copyFile(
      TEMPLATE_CATCH_ALL_PAGE,
      path.join(tmpDir, "app", "[[...permalink]]", "page.tsx"),
    )
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it("analyze-sitemap → generate-page produces site union and prunes the catch-all page", async () => {
    await runAnalyzeSitemap(tmpDir)
    await runGeneratePage(tmpDir)

    const analysisPath = path.join(tmpDir, "sitemap-analysis.json")
    const analysis = JSON.parse(await fs.readFile(analysisPath, "utf8"))

    expect(analysis.layouts).toEqual(["content", "file", "homepage", "index"])
    expect(analysis.components).toEqual([
      "childrenpages",
      "hero",
      "image",
      "prose",
    ])

    const nestedAboutPage = path.join(tmpDir, "app", "about", "page.tsx")
    await expect(fs.access(nestedAboutPage)).rejects.toThrow()

    const catchAll = path.join(tmpDir, "app", "[[...permalink]]", "page.tsx")
    const catchAllContent = await fs.readFile(catchAll, "utf8")

    expect(catchAllContent).not.toContain("STATIC_ROUTE_PERMALINK")

    expect(catchAllContent).toMatch(/case "homepage"/)
    expect(catchAllContent).toMatch(/case "content"/)
    expect(catchAllContent).toMatch(/case "index"/)
    expect(catchAllContent).not.toMatch(/case "article"/)

    expect(catchAllContent).toMatch(/case "hero"/)
    expect(catchAllContent).toMatch(/case "prose"/)
    expect(catchAllContent).toMatch(/case "image"/)
    expect(catchAllContent).toMatch(/case "childrenpages"/)
    expect(catchAllContent).not.toMatch(/case "accordion"/)
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
