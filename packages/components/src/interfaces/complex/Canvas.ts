import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { CanvasProseSchema } from "../native/Prose"
import { AccordionSchema } from "./Accordion"
import { BlockquoteSchema } from "./Blockquote"
import { CalloutSchema } from "./Callout"
import { ContentpicSchema } from "./Contentpic"
import { ImageSchema } from "./Image"
import { ImageGallerySchema } from "./ImageGallery"
import { InfoColsSchema } from "./InfoCols"
import { KeyStatisticsSchema } from "./KeyStatistics"
import { MapSchema } from "./Map"
import { VideoSchema } from "./Video"

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
        // Studio's number control only renders fully bounded fields, so an
        // unbounded height would not be editable in the form builder
        minimum: 80,
        maximum: 2000,
      }),
    ),
    blocks: Type.Array(
      // ImageSchema stays first: Studio's Add item uses the first member's
      // defaults for new blocks
      Type.Union([
        ImageSchema,
        CanvasProseSchema,
        CalloutSchema,
        AccordionSchema,
        BlockquoteSchema,
        ContentpicSchema,
        InfoColsSchema,
        KeyStatisticsSchema,
        ImageGallerySchema,
        MapSchema,
        VideoSchema,
      ]),
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
  shouldLazyLoad?: boolean
  permalink: string
}
