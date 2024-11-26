import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const AttrsDirSchema = Type.Optional(
  Type.Union([
    Type.Literal("auto"),
    Type.Literal("ltr"),
    Type.Literal("rtl"),
    Type.Null(), // Allow null as an option for default direction
  ]),
)

export type AttrsDirProps = Static<typeof AttrsDirSchema>
