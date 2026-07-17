import type { Static, TObject } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

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

export const CANVAS_GRID_COLUMNS = 12

// Where and how large a block sits on the canvas grid, Wix-style. All fields
// are optional so partial placements still render (the renderer fills in the
// defaults). The format marker routes Studio to its visual grid placement
// picker, the same way "prose" routes to the Tiptap control.
const CanvasGridPlacementSchema = Type.Object(
  {
    colStart: Type.Optional(
      Type.Integer({
        title: "Column start",
        description: `Which of the ${CANVAS_GRID_COLUMNS} grid columns this block starts in. Leave empty to place it after the previous block.`,
        minimum: 1,
        maximum: CANVAS_GRID_COLUMNS,
      }),
    ),
    colSpan: Type.Optional(
      Type.Integer({
        title: "Column width",
        description: `How many of the ${CANVAS_GRID_COLUMNS} grid columns this block spans. Leave empty for full width.`,
        minimum: 1,
        maximum: CANVAS_GRID_COLUMNS,
      }),
    ),
    rowStart: Type.Optional(
      Type.Integer({
        title: "Row start",
        description:
          "Which grid row this block starts in. Leave empty to place it after the previous block.",
        minimum: 1,
        maximum: 100,
      }),
    ),
    rowSpan: Type.Optional(
      Type.Integer({
        title: "Row height",
        description: "How many grid rows this block spans vertically.",
        minimum: 1,
        maximum: 100,
      }),
    ),
  },
  {
    title: "Placement on grid",
    description:
      "Drag on the grid to position and size this block on the canvas. Leave it unplaced to stack the block across the full width.",
    format: "canvasPlacement",
  },
)

export type CanvasBlockPlacementProps = Static<typeof CanvasGridPlacementSchema>

// Merged into every canvas child block. A block without placement stacks
// full-width like before.
const CanvasBlockPlacementSchema = Type.Object({
  placement: Type.Optional(CanvasGridPlacementSchema),
})

// Composite drops the member schema's own options, so the ones Studio relies
// on are copied across: title labels the variant in the combinator picker and
// format routes the Text child to the prose (Tiptap) control.
const asCanvasBlockSchema = <T extends TObject & { format?: string }>(
  schema: T,
) =>
  Type.Composite([schema, CanvasBlockPlacementSchema], {
    ...(schema.title !== undefined && { title: schema.title }),
    ...(schema.description !== undefined && {
      description: schema.description,
    }),
    ...(schema.format !== undefined && { format: schema.format }),
  })

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
        asCanvasBlockSchema(ImageSchema),
        asCanvasBlockSchema(CanvasProseSchema),
        asCanvasBlockSchema(CalloutSchema),
        asCanvasBlockSchema(AccordionSchema),
        asCanvasBlockSchema(BlockquoteSchema),
        asCanvasBlockSchema(ContentpicSchema),
        asCanvasBlockSchema(InfoColsSchema),
        asCanvasBlockSchema(KeyStatisticsSchema),
        asCanvasBlockSchema(ImageGallerySchema),
        asCanvasBlockSchema(MapSchema),
        asCanvasBlockSchema(VideoSchema),
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
  shouldLazyLoad?: boolean
  permalink: string
}
