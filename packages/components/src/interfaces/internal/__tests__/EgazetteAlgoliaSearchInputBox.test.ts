import { FormatRegistry } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"
import { SimpleIntegrationsSettingsSchema } from "~/types/site"

import { EgazetteAlgoliaSearchSchema } from "../EgazetteAlgoliaSearchInputBox"

// "hidden" (and friends) are UI-only annotations consumed by Studio's form
// renderer, not data formats — accept any value, as Studio's validator does.
FormatRegistry.Set("hidden", () => true)

// The category taxonomy is hard-coded in the renderer, not configured here,
// so the config is just the Algolia connection details.
const VALID_CONFIG = {
  appId: "1V7DZGZJKK",
  indexName: "staging_ogp_egazettes_index",
  searchApiKey: "bbc5751b3f9b7fdfc08c99712adfa397",
  type: "egazette-algolia",
}

describe("EgazetteAlgoliaSearchSchema", () => {
  it("accepts a valid config", () => {
    expect(Value.Check(EgazetteAlgoliaSearchSchema, VALID_CONFIG)).toBe(true)
  })

  it.each(["appId", "searchApiKey", "indexName"] as const)(
    "rejects a config missing %s",
    (key) => {
      const { [key]: _omitted, ...rest } = VALID_CONFIG
      expect(Value.Check(EgazetteAlgoliaSearchSchema, rest)).toBe(false)
    },
  )

  it("rejects a config with the wrong type discriminator", () => {
    const config = { ...VALID_CONFIG, type: "searchSG" }
    expect(Value.Check(EgazetteAlgoliaSearchSchema, config)).toBe(false)
  })
})

describe("site.search union", () => {
  it("accepts the egazette-algolia variant", () => {
    expect(
      Value.Check(SimpleIntegrationsSettingsSchema, { search: VALID_CONFIG }),
    ).toBe(true)
  })

  it("still accepts the searchSG variant", () => {
    expect(
      Value.Check(SimpleIntegrationsSettingsSchema, {
        search: { clientId: "some-client-id", type: "searchSG" },
      }),
    ).toBe(true)
  })

  it("still accepts the localSearch variant", () => {
    expect(
      Value.Check(SimpleIntegrationsSettingsSchema, {
        search: { searchUrl: "/search", type: "localSearch" },
      }),
    ).toBe(true)
  })
})
