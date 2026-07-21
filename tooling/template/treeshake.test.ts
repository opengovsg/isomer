import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  buildStubRegex,
  COMPONENT_TARGETS,
  getUnusedTargetDirs,
  LAYOUT_TARGETS,
  scanSchemaUsage,
} from "./treeshake.mjs"

let schemaDir: string

beforeEach(() => {
  schemaDir = fs.mkdtempSync(path.join(os.tmpdir(), "treeshake-test-"))
})

afterEach(() => {
  fs.rmSync(schemaDir, { recursive: true, force: true })
})

const writeSchema = (relativePath: string, page: unknown) => {
  const fullPath = path.join(schemaDir, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, JSON.stringify(page))
}

describe("scanSchemaUsage", () => {
  it("collects layout and top-level content types from schema files", () => {
    writeSchema("_index.json", {
      layout: "homepage",
      content: [{ type: "hero" }, { type: "keystatistics" }],
    })
    writeSchema("about.json", {
      layout: "content",
      content: [{ type: "video" }],
    })

    const usage = scanSchemaUsage(schemaDir)

    expect(usage).not.toBeNull()
    expect(usage?.layouts).toEqual(new Set(["homepage", "content"]))
    expect(usage?.components).toEqual(
      new Set(["hero", "keystatistics", "video"]),
    )
  })

  it("walks nested directories recursively", () => {
    writeSchema("news.json", { layout: "collection", content: [] })
    writeSchema("news/article-one.json", {
      layout: "article",
      content: [{ type: "blockquote" }],
    })

    const usage = scanSchemaUsage(schemaDir)

    expect(usage?.layouts).toEqual(new Set(["collection", "article"]))
    expect(usage?.components).toEqual(new Set(["blockquote"]))
  })

  it("ignores non-JSON files", () => {
    writeSchema("about.json", { layout: "content", content: [] })
    fs.writeFileSync(path.join(schemaDir, "README.md"), "not a schema")

    const usage = scanSchemaUsage(schemaDir)

    expect(usage?.layouts).toEqual(new Set(["content"]))
  })

  it("treats childrenpages as used for every index-layout page, even when the schema never declares it", () => {
    writeSchema("news-index.json", { layout: "index", content: [] })

    const usage = scanSchemaUsage(schemaDir)

    expect(usage?.components.has("childrenpages")).toBe(true)
  })

  it("does not add childrenpages usage for other layouts", () => {
    writeSchema("about.json", { layout: "content", content: [] })

    const usage = scanSchemaUsage(schemaDir)

    expect(usage?.components.has("childrenpages")).toBe(false)
  })

  it("returns null when the schema directory doesn't exist", () => {
    expect(scanSchemaUsage(path.join(schemaDir, "does-not-exist"))).toBeNull()
  })

  it("returns null when a schema file is malformed JSON", () => {
    fs.writeFileSync(path.join(schemaDir, "broken.json"), "{ not json")

    expect(scanSchemaUsage(schemaDir)).toBeNull()
  })
})

describe("getUnusedTargetDirs", () => {
  it("returns every target's dir when nothing is used", () => {
    const usage = { layouts: new Set<string>(), components: new Set<string>() }

    const dirs = getUnusedTargetDirs(usage)

    expect(dirs).toHaveLength(COMPONENT_TARGETS.length + LAYOUT_TARGETS.length)
    expect(dirs).toContain("components/complex/Video")
    expect(dirs).toContain("layouts/Collection")
  })

  it("excludes only the specific components/layouts actually used", () => {
    const usage = {
      layouts: new Set(["homepage"]),
      components: new Set(["hero", "video"]),
    }

    const dirs = getUnusedTargetDirs(usage)

    expect(dirs).not.toContain("components/complex/Video")
    expect(dirs).not.toContain("components/complex/Hero")
    expect(dirs).not.toContain("layouts/Homepage")
    expect(dirs).toContain("components/complex/Blockquote")
    expect(dirs).toContain("layouts/Collection")
    expect(dirs).toContain("layouts/Content")
  })

  it("returns nothing for a target when its schemaType is used under the other kind", () => {
    // "content" is a layout schemaType; make sure a same-named component usage
    // (there isn't one here, but this guards the kind-scoped lookup) doesn't
    // accidentally mark the layout as used.
    const usage = {
      layouts: new Set<string>(),
      components: new Set(["collectionblock"]),
    }

    const dirs = getUnusedTargetDirs(usage)

    expect(dirs).not.toContain("components/complex/CollectionBlock")
    expect(dirs).toContain("layouts/Collection")
  })
})

describe("buildStubRegex", () => {
  it("matches the target's index.js on POSIX-style paths", () => {
    const regex = buildStubRegex("components/complex/Video")

    expect(
      regex.test(
        "/repo/node_modules/@opengovsg/isomer-components/dist/esm/templates/next/components/complex/Video/index.js",
      ),
    ).toBe(true)
  })

  it("matches the target's index.js on Windows-style paths", () => {
    const regex = buildStubRegex("layouts/Collection")

    const winPath = [
      "C:",
      "repo",
      "templates",
      "next",
      "layouts",
      "Collection",
      "index.js",
    ].join("\\")

    expect(regex.test(winPath)).toBe(true)
  })

  it("does not match a different target with a similar name", () => {
    const regex = buildStubRegex("components/complex/Accordion")

    expect(
      regex.test(
        "/repo/templates/next/components/complex/AccordionGroup/index.js",
      ),
    ).toBe(false)
  })

  it("does not match a non-index file within the target's folder", () => {
    const regex = buildStubRegex("components/complex/Video")

    expect(
      regex.test("/repo/templates/next/components/complex/Video/utils.js"),
    ).toBe(false)
  })
})
