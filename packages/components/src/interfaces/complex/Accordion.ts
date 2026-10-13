import type { Static, TSchema, TUnsafe } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { BLOCK_LIST_FORMAT } from "../format"
import { AccordionProseSchema, ProseSchema } from "../native/Prose"
import { IsomerString } from "../primitives/IsomerString"
import { BlockquoteSchema } from "./Blockquote"
import { ColumnDefaultSchema } from "./Column"
import { ImageSchema } from "./Image"
import { InfobarDefaultSchema } from "./Infobar"

const AccordionSummarySchema = IsomerString({
  title: "Title",
})

// Blocks allowed directly inside an Accordion: the same content blocks a
// Column accepts (keep this list in sync with Column.ts), plus a Column. A
// Column cannot hold another container, so nesting stops at
// Accordion → Column → content block.
const accordionContentBlockUnion = Type.Union([
  Type.Ref(ProseSchema),
  ImageSchema,
  InfobarDefaultSchema,
  BlockquoteSchema,
  ColumnDefaultSchema,
])

export type AccordionContentBlock = Static<typeof accordionContentBlockUnion>

// See ContainerContentBlockSchema in Column.ts for why the type is narrowed.
export const AccordionContentBlockSchema =
  accordionContentBlockUnion as unknown as TUnsafe<AccordionContentBlock>

export const AccordionContentSchema = Type.Array(AccordionContentBlockSchema, {
  title: "Content blocks",
  description: "Shown when the accordion is opened. Drag to reorder.",
  format: BLOCK_LIST_FORMAT,
})

// Accordion items created before container blocks only have `details` (a
// single prose body). Newer ones have `content` (a list of blocks). Both are
// optional so every published page keeps validating; the renderer prefers
// `content` when present.
export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: AccordionSummarySchema,
    details: Type.Optional(AccordionProseSchema),
    content: Type.Optional(AccordionContentSchema),
  },
  { title: "Accordion" },
)

// Editing schema for the legacy prose-only accordion.
export const AccordionProseEditorSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: AccordionSummarySchema,
    details: AccordionProseSchema,
  },
  { title: "Accordion" },
)

// Editing schema for the accordion as a container block. `details` is kept
// hidden so that an un-migrated item still round-trips through the form.
export const AccordionContainerEditorSchema: TSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: AccordionSummarySchema,
    details: Type.Optional({ ...AccordionProseSchema, format: "hidden" }),
    content: AccordionContentSchema,
  },
  { title: "Accordion" },
)

export type AccordionProps = Static<typeof AccordionSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  permalink: string
  shouldLazyLoad?: boolean
  headingLevel: number
}
