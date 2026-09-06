import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { MAPS_EMBED_URL_PATTERN } from "~/utils/validation"

export const MapSchema = Type.Object(
  {
    title: Type.String({
      description:
        "This is not shown on the page, but is compulsory for accessibility",
      title: "Label for screen readers",
    }),
    type: Type.Literal("map", { default: "map" }),
    url: Type.String({
      format: "embed",
      pattern: MAPS_EMBED_URL_PATTERN,
      title: "Map to embed",
    }),
  },
  {
    description:
      "The map component is used to embed a map of a location or area within the current page.",
    title: "Map",
  },
)

export type MapProps = Static<typeof MapSchema> & {
  shouldLazyLoad?: boolean
}
