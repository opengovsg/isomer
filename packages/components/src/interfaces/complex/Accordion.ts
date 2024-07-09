import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ProseSchema } from "../native"

export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion"),
    summary: Type.String({
      title: "Accordion summary",
      description: "The summary for the accordion",
    }),
    details: ProseSchema,
  },
  { title: "Accordion component" },
)

export type AccordionProps = Static<typeof AccordionSchema>
