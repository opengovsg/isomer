import { afterEach, beforeAll, describe, expect, it } from "vitest"

import {
  buildComponents,
  buildTemplate,
  readConfigFixture,
  readTemplateConfig,
  writeTemplateConfig,
} from "./helpers/buildTemplate"
import { scanBundleForAlgolia } from "./helpers/scanBundle"

describe("template bundle pruning", () => {
  let originalConfig: string

  beforeAll(() => {
    buildComponents()
    originalConfig = readTemplateConfig()
  })

  afterEach(() => {
    writeTemplateConfig(originalConfig)
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
    writeTemplateConfig(readConfigFixture("egazette-algolia"))
    const outDir = buildTemplate()

    // Act
    const result = scanBundleForAlgolia(outDir)

    // Assert
    expect(result.found, result.matchedMarkers.join(", ")).toBe(true)
  })
})
