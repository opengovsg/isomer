import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ProseSchema } from "../native"

export const CALLOUT_VARIANTS = [
  "info",
  "success",
  "warning",
  "critical",
] as const

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout"),
    content: ProseSchema,
    variant: Type.Union(
      CALLOUT_VARIANTS.map((variant) => Type.Literal(variant)),
      {
        title: "Callout variant",
        description: "The variant of the callout to use",
      },
    ),
  },
  {
    title: "Callout component",
    description: "A component that highlights important information",
  },
)

export type CalloutProps = Static<typeof CalloutSchema>
