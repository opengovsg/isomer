import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const BoldMarkSchema = Type.Object({
  type: Type.Literal("bold", { default: "bold" }),
})

const CodeMarkSchema = Type.Object({
  type: Type.Literal("code", { default: "code" }),
})

const ItalicMarkSchema = Type.Object({
  type: Type.Literal("italic", { default: "italic" }),
})

const LinkMarkSchema = Type.Object({
  type: Type.Literal("link", { default: "link" }),
  href: Type.String(),
})

const StrikeMarkSchema = Type.Object({
  type: Type.Literal("strike", { default: "strike" }),
})

const SubscriptMarkSchema = Type.Object({
  type: Type.Literal("subscript", { default: "subscript" }),
})

const SuperscriptMarkSchema = Type.Object({
  type: Type.Literal("superscript", { default: "superscript" }),
})

const UnderlineMarkSchema = Type.Object({
  type: Type.Literal("underline", { default: "underline" }),
})

export const TextSchema = Type.Object(
  {
    type: Type.Literal("text", { default: "text" }),
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
