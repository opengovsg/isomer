import { afterEach, beforeAll, describe, expect, it } from "vitest"

import {
  buildTemplate,
  readTemplateConfig,
  withTemplateConfig,
  writeTemplateConfig,
} from "./helpers/buildTemplate"
import { ALGOLIA_MARKERS, scanBundleForAlgolia } from "./helpers/scanBundle"

describe("template (bundle pruning)", () => {
  let originalConfig: string

  beforeAll(() => {
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
    expect(result.matchedMarkers, result.matchedMarkers.join(", ")).toEqual([])
  })

  it("includes Algolia search deps for egazette-algolia sites", () => {
    // Arrange
    writeTemplateConfig(
      withTemplateConfig(originalConfig, (config) => {
        ;(config.site as Record<string, unknown>).search = {
          type: "egazette-algolia",
          appId: "1V7DZGZJKK",
          searchApiKey: "bbc5751b3f9b7fdfc08c99712adfa397",
          indexName: "staging_ogp_egazettes_index",
        }
      }),
    )
    const outDir = buildTemplate()

    // Act
    const result = scanBundleForAlgolia(outDir)

    // Assert
    for (const marker of ALGOLIA_MARKERS) {
      expect(
        result.matchedMarkers.includes(marker),
        `expected bundle to include ${marker}`,
      ).toBe(true)
    }
  })
})
