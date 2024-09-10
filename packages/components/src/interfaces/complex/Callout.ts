import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { CalloutProseSchema } from "../native/Prose"

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    content: CalloutProseSchema,
  },
  {
    title: "Callout component",
    description: "A component that highlights important information",
  },
)

export type CalloutProps = Static<typeof CalloutSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
