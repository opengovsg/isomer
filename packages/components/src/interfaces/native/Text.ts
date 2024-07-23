import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const BoldMarkSchema = Type.Object(
  {
    type: Type.Literal("bold", { default: "bold" }),
  },
  {
    title: "Bold",
  },
)

const CodeMarkSchema = Type.Object(
  {
    type: Type.Literal("code", { default: "code" }),
  },
  {
    title: "Code",
  },
)

const ItalicMarkSchema = Type.Object(
  {
    type: Type.Literal("italic", { default: "italic" }),
  },
  {
    title: "Italic",
  },
)

const LinkMarkSchema = Type.Object(
  {
    type: Type.Literal("link", { default: "link" }),
    attrs: Type.Object({
      target: Type.Union([
        // NOTE: Taken with reference to
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target
        // There's technically 1 more property - unfencedTop but we're disallowing
        // because it allows embedded frames to traverse beyond its root
        Type.Literal("_blank"),
        Type.Literal("_self"),
        Type.Literal("_parent"),
        Type.Literal("_top"),
      ]),
      // NOTE: The href given by tiptap here
      // https://github.com/ueberdosis/tiptap/blob/main/packages/extension-link/src/link.ts
      // defaults to `null` href but href could also be passed as `undefined`
      href: Type.Union([Type.String(), Type.Null(), Type.Undefined()]),
      rel: Type.String(),
      class: Type.String(),
    }),
  },
  {
    title: "Hyperlink",
  },
)

const StrikeMarkSchema = Type.Object(
  {
    type: Type.Literal("strike", { default: "strike" }),
  },
  {
    title: "Strikethrough",
  },
)

const SubscriptMarkSchema = Type.Object(
  {
    type: Type.Literal("subscript", { default: "subscript" }),
  },
  {
    title: "Subscript",
  },
)

const SuperscriptMarkSchema = Type.Object(
  {
    type: Type.Literal("superscript", { default: "superscript" }),
  },
  {
    title: "Superscript",
  },
)

const UnderlineMarkSchema = Type.Object(
  {
    type: Type.Literal("underline", { default: "underline" }),
  },
  {
    title: "Underline",
  },
)

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
