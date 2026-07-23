import { afterAll, describe, expect, it } from "vitest"

import { buildTemplate, restoreTemplateConfig } from "./helpers/buildTemplate"
import { scanBundleForAlgolia } from "./helpers/scanBundle"

describe.sequential("template bundle pruning", () => {
  afterAll(() => {
    restoreTemplateConfig()
  })

  it("excludes Algolia search deps for non-egazette sites", () => {
    const outDir = buildTemplate()
    const result = scanBundleForAlgolia(outDir)

    expect(result.found, result.matchedMarkers.join(", ")).toBe(false)
  })

  it("includes Algolia search deps for egazette-algolia sites", () => {
    const outDir = buildTemplate({ configFixture: "egazette-algolia" })
    const result = scanBundleForAlgolia(outDir)

    expect(result.found, result.matchedMarkers.join(", ")).toBe(true)
  })
})
