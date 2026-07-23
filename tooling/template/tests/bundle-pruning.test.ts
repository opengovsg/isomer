import { afterAll, describe, expect, it } from "vitest"

import { buildTemplate, restoreTemplateConfig } from "./helpers/buildTemplate"
import { scanBundleForAlgolia } from "./helpers/scanBundle"

describe.sequential("template bundle pruning", () => {
  afterAll(() => {
    restoreTemplateConfig()
  })

  it("excludes Algolia search deps for non-egazette sites", () => {
    // Arrange
    const outDir = buildTemplate()

    // Act
    const result = scanBundleForAlgolia(outDir)

    // Assert
    expect(result.found, result.matchedMarkers.join(", ")).toBe(false)
  })

  it("includes Algolia search deps for egazette-algolia sites", () => {
    // Arrange
    const outDir = buildTemplate({ configFixture: "egazette-algolia" })

    // Act
    const result = scanBundleForAlgolia(outDir)

    // Assert
    expect(result.found, result.matchedMarkers.join(", ")).toBe(true)
  })
})
