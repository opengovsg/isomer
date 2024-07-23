import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ProseSchema } from "../native"

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    content: Type.Ref(ProseSchema),
  },
  {
    title: "Callout component",
    description: "A component that highlights important information",
  },
)

export type CalloutProps = Static<typeof CalloutSchema>
