import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const AttrsDirSchema = Type.Optional(
  Type.Union([
    Type.Literal("auto"),
    Type.Literal("ltr"),
    Type.Literal("rtl"),
    // Used by tiptap-text-direction when the direction is not set
    Type.Null(),
  ]),
)

export type AttrsDirProps = Static<typeof AttrsDirSchema>
