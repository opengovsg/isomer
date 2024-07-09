import { Type, type Static } from "@sinclair/typebox"

const BoldMarkSchema = Type.Object({
  type: Type.Literal("bold"),
})

const CodeMarkSchema = Type.Object({
  type: Type.Literal("code"),
})

const ItalicMarkSchema = Type.Object({
  type: Type.Literal("italic"),
})

const LinkMarkSchema = Type.Object({
  type: Type.Literal("link"),
  href: Type.String(),
})

const StrikeMarkSchema = Type.Object({
  type: Type.Literal("strike"),
})

const SubscriptMarkSchema = Type.Object({
  type: Type.Literal("subscript"),
})

const SuperscriptMarkSchema = Type.Object({
  type: Type.Literal("superscript"),
})

const UnderlineMarkSchema = Type.Object({
  type: Type.Literal("underline"),
})

export const TextSchema = Type.Object(
  {
    type: Type.Literal("text"),
    marks: Type.Optional(
      Type.Array(
        Type.Union([
          BoldMarkSchema,
          CodeMarkSchema,
          ItalicMarkSchema,
          LinkMarkSchema,
          StrikeMarkSchema,
          SubscriptMarkSchema,
          SuperscriptMarkSchema,
          UnderlineMarkSchema,
        ]),
      ),
    ),
    text: Type.String(),
  },
  {
    title: "Text content",
  },
)

type BoldMark = Static<typeof BoldMarkSchema>
type CodeMark = Static<typeof CodeMarkSchema>
type ItalicMark = Static<typeof ItalicMarkSchema>
type LinkMark = Static<typeof LinkMarkSchema>
type StrikeMark = Static<typeof StrikeMarkSchema>
type SubscriptMark = Static<typeof SubscriptMarkSchema>
type SuperscriptMark = Static<typeof SuperscriptMarkSchema>
type UnderlineMark = Static<typeof UnderlineMarkSchema>

export type Marks =
  | BoldMark
  | CodeMark
  | ItalicMark
  | LinkMark
  | StrikeMark
  | SubscriptMark
  | SuperscriptMark
  | UnderlineMark

export type TextProps = Static<typeof TextSchema>
