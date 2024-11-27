import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const AttrsDirSchema = Type.Optional(
  Type.Union([
    Type.Literal("auto"),
    Type.Literal("ltr"),
    Type.Literal("rtl"),
    Type.Null(), // Used by tiptap-text-direction when the direction is not set
  ]),
)

export type AttrsDirProps = Static<typeof AttrsDirSchema>
