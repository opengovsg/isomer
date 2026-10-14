import type { Static, TUnsafe } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { COLUMN_LAYOUT_FORMAT, COLUMN_SLOTS_FORMAT } from "../format"
import { ProseSchema } from "../native/Prose"
import { BlockquoteSchema } from "./Blockquote"
import { ImageSchema } from "./Image"
import { InfobarDefaultSchema } from "./Infobar"

export const COLUMN_LAYOUT = {
  twoEqual: "twoEqual",
  oneThirdTwoThirds: "oneThirdTwoThirds",
  twoThirdsOneThird: "twoThirdsOneThird",
  threeEqual: "threeEqual",
} as const

export type ColumnLayout = (typeof COLUMN_LAYOUT)[keyof typeof COLUMN_LAYOUT]

export const DEFAULT_COLUMN_LAYOUT = COLUMN_LAYOUT.twoEqual

export const COLUMN_LAYOUT_LABELS: Record<ColumnLayout, string> = {
  twoEqual: "Two equal",
  oneThirdTwoThirds: "⅓ / ⅔",
  twoThirdsOneThird: "⅔ / ⅓",
  threeEqual: "Three equal",
}

export const COLUMN_LAYOUT_COLUMN_COUNT: Record<ColumnLayout, number> = {
  twoEqual: 2,
  oneThirdTwoThirds: 2,
  twoThirdsOneThird: 2,
  threeEqual: 3,
}

// Content blocks that may be placed inside a container block (Accordion or
// Column). This is the structural guardrail for nesting: anything not listed
// here cannot go into a container, and containers cannot nest themselves.
// Infobar uses the non-homepage variant because the dark style is a
// full-width homepage treatment that does not fit inside a column.
const containerContentBlockUnion = Type.Union([
  Type.Ref(ProseSchema),
  ImageSchema,
  InfobarDefaultSchema,
  BlockquoteSchema,
])

export type ContainerContentBlock = Static<typeof containerContentBlockUnion>

// Nesting this union inside Column and then Accordion makes the inferred
// TypeBox type of the page schema too large for TypeScript to serialise
// (TS7056). Narrowing the *type* to the named alias keeps declarations small
// while leaving the runtime schema object untouched for validation.
export const ContainerContentBlockSchema =
  containerContentBlockUnion as unknown as TUnsafe<ContainerContentBlock>

export const ColumnContentSchema = Type.Array(ContainerContentBlockSchema, {
  title: "Column",
  // One block per column for now, so column widths stay predictable.
  maxItems: 1,
})

const generateColumnLayoutSchema = ({
  isThreeColumnsAllowed,
}: {
  isThreeColumnsAllowed: boolean
}) =>
  Type.Union(
    [
      Type.Literal(COLUMN_LAYOUT.twoEqual, {
        title: COLUMN_LAYOUT_LABELS.twoEqual,
      }),
      Type.Literal(COLUMN_LAYOUT.oneThirdTwoThirds, {
        title: COLUMN_LAYOUT_LABELS.oneThirdTwoThirds,
      }),
      Type.Literal(COLUMN_LAYOUT.twoThirdsOneThird, {
        title: COLUMN_LAYOUT_LABELS.twoThirdsOneThird,
      }),
      // Three columns are too narrow for the content page width, so they are
      // only offered on the homepage.
      ...(isThreeColumnsAllowed
        ? [
            Type.Literal(COLUMN_LAYOUT.threeEqual, {
              title: COLUMN_LAYOUT_LABELS.threeEqual,
            }),
          ]
        : []),
    ],
    {
      title: "Layout",
      default: DEFAULT_COLUMN_LAYOUT,
      format: COLUMN_LAYOUT_FORMAT,
      type: "string",
    },
  )

const generateColumnSchema = ({
  isThreeColumnsAllowed,
}: {
  isThreeColumnsAllowed: boolean
}) =>
  Type.Object(
    {
      type: Type.Literal("column", { default: "column" }),
      variant: generateColumnLayoutSchema({ isThreeColumnsAllowed }),
      columns: Type.Array(ColumnContentSchema, {
        title: "Columns",
        format: COLUMN_SLOTS_FORMAT,
        minItems: 2,
        maxItems: isThreeColumnsAllowed ? 3 : 2,
      }),
    },
    {
      title: "Column",
      description: "Place blocks side by side in columns.",
    },
  )

// Superset used for page validation and on the homepage.
export const ColumnHomepageSchema = generateColumnSchema({
  isThreeColumnsAllowed: true,
})

// Used on every other page layout, and whenever a Column sits inside another
// container block (e.g. an Accordion), regardless of the page layout.
export const ColumnDefaultSchema = generateColumnSchema({
  isThreeColumnsAllowed: false,
})

export type ColumnProps = Static<typeof ColumnHomepageSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  permalink: string
  shouldLazyLoad?: boolean
  headingLevel: number
}
