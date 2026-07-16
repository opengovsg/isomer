import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { AccordionSchema } from "./Accordion"
import { CalloutSchema } from "./Callout"
import { ImageSchema } from "./Image"

export const CanvasSchema = Type.Object(
  {
    type: Type.Literal("canvas", { default: "canvas" }),
    width: Type.Optional(
      Type.Number({
        title: "Width (%)",
        description: "Width of the canvas as a percentage of the page width",
        minimum: 10,
        maximum: 100,
      }),
    ),
    height: Type.Optional(
      Type.Number({
        title: "Height (px)",
        description:
          "Fixed height of the canvas in pixels. Leave empty to fit the content.",
        minimum: 80,
      }),
    ),
    blocks: Type.Array(
      Type.Union([ImageSchema, CalloutSchema, AccordionSchema]),
      {
        title: "Canvas blocks",
        description: "Components to display inside the canvas",
        default: [],
      },
    ),
  },
  {
    title: "Canvas",
    description: "A resizable container that holds other components",
  },
)

export type CanvasProps = Static<typeof CanvasSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  permalink: string
}
