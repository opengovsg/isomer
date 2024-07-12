import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const HardBreakSchema = Type.Object({
  type: Type.Literal("hardBreak"),
})

export type HardBreakProps = Static<typeof HardBreakSchema>
