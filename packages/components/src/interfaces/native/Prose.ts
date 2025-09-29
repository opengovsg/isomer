import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { DividerSchema } from "./Divider"
import { HeadingSchema } from "./Heading"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { TableSchema } from "./Table"
import { UnorderedListSchema } from "./UnorderedList"

const PROSE_CONTENT_VALUE_SCHEMA = Type.Array(
  Type.Union([
    DividerSchema,
    HeadingSchema,
    OrderedListSchema,
    ParagraphSchema,
    TableSchema,
    UnorderedListSchema,
  ]),
)

const PROSE_CONTENT_SCHEMA = Type.Array(
  Type.Union([
    Type.Ref(DividerSchema),
    Type.Ref(HeadingSchema),
    Type.Ref(OrderedListSchema),
    Type.Ref(ParagraphSchema),
    Type.Ref(TableSchema),
    Type.Ref(UnorderedListSchema),
  ]),
  {
    title: "Content",
    minItems: 1,
  },
)

const BASE_PROSE_META = {
  title: "Content",
}

export type ComponentsWithProse =
  | "prose"
  | "accordion"
  | "callout"
  | "contentpic"

const generateProseSchema = ({
  id,
  format = "prose",
  isRequired = false,
}: {
  id?: string
  format?: ComponentsWithProse
  isRequired?: boolean
}) => {
  return Type.Object(
    {
      type: Type.Literal("prose"),
      content: isRequired
        ? PROSE_CONTENT_SCHEMA
        : Type.Optional(PROSE_CONTENT_SCHEMA),
    },
    {
      ...(id && { $id: id }),
      ...BASE_PROSE_META,
      format,
    },
  )
}

// NOTE: We need this for other parts of our codebase
// that relies on json forms but is not part of components.
// because our original prose schema uses `Type.Ref`,
// these sections of our codebase are unable to extract the reference
// leading to errors
export const ProseValueSchema = Type.Object(
  {
    type: Type.Literal("prose"),
    content: PROSE_CONTENT_VALUE_SCHEMA,
  },
  { format: "prose" },
)

export const ProseSchema = generateProseSchema({
  id: "components-native-prose",
})
export const BaseProseSchema = generateProseSchema({})
export const AccordionProseSchema = generateProseSchema({
  format: "accordion",
  isRequired: true,
})
export const CalloutProseSchema = generateProseSchema({
  format: "callout",
  isRequired: true,
})
export const ContentpicProseSchema = generateProseSchema({
  format: "contentpic",
  isRequired: true,
})

export type ProseProps = Static<typeof ProseSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
  shouldStripContentHtmlTags?: boolean
}
export type ProseContent = ProseProps["content"]
