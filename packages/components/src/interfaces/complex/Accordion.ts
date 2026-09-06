import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AccordionProseSchema } from "../native/Prose"

export const AccordionSchema = Type.Object(
  {
    details: AccordionProseSchema,
    summary: Type.String({
      title: "Title",
    }),
    type: Type.Literal("accordion", { default: "accordion" }),
  },
  { title: "Accordion" },
)

export type AccordionProps = Static<typeof AccordionSchema> & {
  site: IsomerSiteProps
  headingLevel: number
}
