import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { BaseProseSchema } from "../native/Prose"

export const CALLOUT_VARIANTS = [
  "info",
  "success",
  "warning",
  "critical",
] as const

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    content: BaseProseSchema,
  },
  {
    title: "Callout component",
    description: "A component that highlights important information",
  },
)

export type CalloutProps = Static<typeof CalloutSchema>
