import { afterEach, beforeAll, describe, expect, it } from "vitest"

import {
  buildTemplate,
  readTemplateConfig,
  withTemplateConfig,
  writeTemplateConfig,
} from "./helpers/buildTemplate"
import {
  ALGOLIA_MARKERS,
  HERO_CLIENT_MARKERS,
  scanBundleForAlgolia,
  scanBundleForHeroClients,
  scanBundleForZod,
} from "./helpers/scanBundle"
import {
  readHeroSchemaBackups,
  restoreHeroSchemas,
  rewriteSchemaHeroVariant,
} from "./helpers/templateSchema"

describe("template (bundle pruning)", () => {
  let originalConfig: string
  let defaultOutDir: string

  beforeAll(() => {
    originalConfig = readTemplateConfig()
    defaultOutDir = buildTemplate()
  })

  afterEach(() => {
    writeTemplateConfig(originalConfig)
  })

  it("excludes Algolia search deps for non-egazette sites", () => {
    // Arrange (default template built in beforeAll) / Act
    const result = scanBundleForAlgolia(defaultOutDir)

    // Assert
    expect(result.matchedMarkers, result.matchedMarkers.join(", ")).toEqual([])
  })

  it("excludes zod from the client bundle", () => {
    // Arrange (default template built in beforeAll) / Act
    const result = scanBundleForZod(defaultOutDir)

    // Assert
    expect(result.matchedMarkers, result.matchedMarkers.join(", ")).toEqual([])
  })

  describe("hero variant stubs", () => {
    let schemaBackup: Record<string, string>

    beforeAll(() => {
      schemaBackup = readHeroSchemaBackups()
    })

    afterEach(() => {
      restoreHeroSchemas(schemaBackup)
    })

    it("excludes carousel and large-image client strings for gradient-only heroes", () => {
      // Arrange (default template built in beforeAll) / Act
      const result = scanBundleForHeroClients(defaultOutDir)

      // Assert
      expect(result.matchedMarkers, result.matchedMarkers.join(", ")).toEqual(
        [],
      )
    })

    it("includes carousel client strings when schema uses carousel", () => {
      // Arrange
      rewriteSchemaHeroVariant("carousel")
      const outDir = buildTemplate()

      // Act
      const result = scanBundleForHeroClients(outDir)

      // Assert
      expect(
        result.matchedMarkers.includes(HERO_CLIENT_MARKERS[0]),
        "expected bundle to include carousel controls",
      ).toBe(true)
      expect(
        result.matchedMarkers.includes(HERO_CLIENT_MARKERS[1]),
        "large image should stay stubbed when only carousel is in schema",
      ).toBe(false)
    })

    it("includes large-image client strings when schema uses largeImage", () => {
      // Arrange
      rewriteSchemaHeroVariant("largeImage")
      const outDir = buildTemplate()

      // Act
      const result = scanBundleForHeroClients(outDir)

      // Assert
      expect(
        result.matchedMarkers.includes(HERO_CLIENT_MARKERS[1]),
        "expected bundle to include large-image client UI",
      ).toBe(true)
      expect(
        result.matchedMarkers.includes(HERO_CLIENT_MARKERS[0]),
        "carousel should stay stubbed when only largeImage is in schema",
      ).toBe(false)
    })
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
