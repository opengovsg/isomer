import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AccordionProseSchema } from "../native/Prose"
import { IsomerString } from "../primitives/IsomerString"

export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: IsomerString({
      title: "Title",
    }),
    details: AccordionProseSchema,
  },
  { title: "Accordion" },
)

export type AccordionProps = Static<typeof AccordionSchema> & {
  site: IsomerSiteProps
  headingLevel: number
}
