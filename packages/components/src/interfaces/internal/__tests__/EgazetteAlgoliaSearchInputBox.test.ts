import { FormatRegistry } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

// "hidden" (and friends) are UI-only annotations consumed by Studio's form
// renderer, not data formats — accept any value, as Studio's validator does.
FormatRegistry.Set("hidden", () => true)
import { SimpleIntegrationsSettingsSchema } from "~/types/site"

import { EgazetteAlgoliaSearchSchema } from "../EgazetteAlgoliaSearchInputBox"

const VALID_CONFIG = {
  type: "egazette-algolia",
  appId: "1V7DZGZJKK",
  searchApiKey: "bbc5751b3f9b7fdfc08c99712adfa397",
  indexName: "staging_ogp_egazettes_index",
  categories: [
    {
      value: "Government Gazette",
      displayLabel: "Government Gazette",
      subCategories: [
        {
          value: "Bankruptcy Act Notice",
          displayLabel: "Notices (Bankruptcy Act)",
        },
        { value: "Tenders", displayLabel: "Tenders" },
      ],
    },
    {
      value: "Legislative Supplements",
      displayLabel: "Legislation Supplements",
    },
  ],
}

describe("EgazetteAlgoliaSearchSchema", () => {
  it("accepts a config matching the egazette taxonomy", () => {
    expect(Value.Check(EgazetteAlgoliaSearchSchema, VALID_CONFIG)).toBe(true)
  })

  it("accepts categories without subCategories", () => {
    const config = {
      ...VALID_CONFIG,
      categories: [{ value: "Others", displayLabel: "Others" }],
    }
    expect(Value.Check(EgazetteAlgoliaSearchSchema, config)).toBe(true)
  })

  it.each(["appId", "searchApiKey", "indexName", "categories"] as const)(
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

  it("rejects sub-categories missing a displayLabel", () => {
    const config = {
      ...VALID_CONFIG,
      categories: [
        {
          value: "Government Gazette",
          displayLabel: "Government Gazette",
          subCategories: [{ value: "Tenders" }],
        },
      ],
    }
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
        search: { type: "searchSG", clientId: "some-client-id" },
      }),
    ).toBe(true)
  })

  it("still accepts the localSearch variant", () => {
    expect(
      Value.Check(SimpleIntegrationsSettingsSchema, {
        search: { type: "localSearch", searchUrl: "/search" },
      }),
    ).toBe(true)
  })
})
