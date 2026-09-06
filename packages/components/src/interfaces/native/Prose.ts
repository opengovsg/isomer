import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { DividerSchema } from "./Divider"
import { HeadingSchema } from "./Heading"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { TableSchema } from "./Table"
import { UnorderedListSchema } from "./UnorderedList"

const PROSE_CONTENT_VALUE_SCHEMA = Type.Array(
  Type.Union([DividerSchema, ParagraphSchema]),
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
    minItems: 1,
    title: "Content",
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
  | "simple-prose"

const generateProseSchema = ({
  id,
  format = "prose",
  isRequired = false,
}: {
  id?: string
  format?: ComponentsWithProse
  isRequired?: boolean
}) => {
  const metadata = {
    ...BASE_PROSE_META,
    format,
  }

  if (id !== undefined && id !== "") {
    return Type.Object(
      {
        content: isRequired
          ? PROSE_CONTENT_SCHEMA
          : Type.Optional(PROSE_CONTENT_SCHEMA),
        type: Type.Literal("prose"),
      },
      {
        $id: id,
        ...metadata,
      },
    )
  }

  return Type.Object(
    {
      content: isRequired
        ? PROSE_CONTENT_SCHEMA
        : Type.Optional(PROSE_CONTENT_SCHEMA),
      type: Type.Literal("prose"),
    },
    metadata,
  )
}


// NOTE: We need this for other parts of our codebase
// that relies on json forms but is not part of components.
// because our original prose schema uses `Type.Ref`,
// these sections of our codebase are unable to extract the reference
// leading to errors
export const SimpleProseSchema = Type.Object(
  {
    content: PROSE_CONTENT_VALUE_SCHEMA,
    type: Type.Literal("prose"),
  },
  { format: "simple-prose" },
)

export const ProseSchema = generateProseSchema({
  id: "components-native-prose",
})
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
  site: IsomerSiteProps
  shouldStripContentHtmlTags?: boolean
  // Applied to every heading rendered within this Prose block — see
  // HeadingProps.headingLevel.
  headingLevel: number
}
export type ProseContent = ProseProps["content"]
