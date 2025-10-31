import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { LinkComponentType } from "~/types"
import { MAPS_EMBED_URL_PATTERN } from "~/utils/validation"

export const MapSchema = Type.Object(
  {
    type: Type.Literal("map", { default: "map" }),
    url: Type.String({
      title: "Map to embed",
      pattern: MAPS_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: Type.String({
      title: "Label for screen readers",
      description:
        "This is not shown on the page, but is compulsory for accessibility",
    }),
  },
  {
    title: "Map component",
    description:
      "The map component is used to embed a map of a location or area within the current page.",
  },
)

export type MapProps = Static<typeof MapSchema> & {
  LinkComponent?: LinkComponentType
}
