import type { IsomerSchema } from "@opengovsg/isomer-components"
import { omit } from "lodash-es"

const IMAGE_FIELD_KEYS = ["imageUrl", "imageAlt", "imageFit"] as const

// Drops fields the active InfoCards variant does not use so persisted JSON
// stays aligned with the chosen layout. The editor keeps those fields in
// memory so toggling variants without saving can restore them.
export function stripInactiveInfoCardFields(page: IsomerSchema): IsomerSchema {
  return {
    ...page,
    content: page.content.map((block) => {
      if (block.type !== "infocards") {
        return block
      }

      if (block.variant === "cardsWithoutImages") {
        return {
          ...block,
          cards: block.cards.map((card) => omit(card, IMAGE_FIELD_KEYS)),
        }
      }

      if (block.variant === "cardsWithFullImages") {
        return {
          ...block,
          cards: block.cards.map((card) => omit(card, ["description"])),
        }
      }

      return block
    }),
  }
}
