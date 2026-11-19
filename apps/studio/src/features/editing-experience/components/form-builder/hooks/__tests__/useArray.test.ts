import type { JsonSchema } from "@jsonforms/core"
import {
  INFOCARDS_CAROUSEL_MAX_CARDS,
  InfoCardsHomepageSchema,
} from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { getConditionalMaxItems } from "../useArray"

const schema = InfoCardsHomepageSchema as JsonSchema

describe("getConditionalMaxItems", () => {
  it("should cap cards when display is carousel", () => {
    // Act
    const maxItems = getConditionalMaxItems(
      schema,
      { display: "carousel", cards: [] },
      "cards",
    )

    // Assert
    expect(maxItems).toBe(INFOCARDS_CAROUSEL_MAX_CARDS)
  })

  it("should not cap cards when display is wrap or unset", () => {
    // Act + Assert
    expect(
      getConditionalMaxItems(schema, { display: "wrap", cards: [] }, "cards"),
    ).toBeUndefined()
    expect(
      getConditionalMaxItems(schema, { cards: [] }, "cards"),
    ).toBeUndefined()
  })
})
