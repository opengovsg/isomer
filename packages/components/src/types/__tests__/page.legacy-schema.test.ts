import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("legacy collection category/tags schema", () => {
  it("keeps deprecated category and tags schema blocks commented out", () => {
    const source = readFileSync(join(__dirname, "../page.ts"), "utf8")

    expect(source).toContain("// const categorySchemaObject")
    expect(source).toContain("// const TagsSchema")
    expect(source).not.toMatch(/^const categorySchemaObject/m)
    expect(source).not.toMatch(/^const TagsSchema/m)
  })
})
