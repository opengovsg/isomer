import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { AccordionProseSchema } from "../native/Prose"

export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: Type.String({
      title: "Title",
    }),
    details: AccordionProseSchema,
  },
  { title: "Accordion component" },
)

export type AccordionProps = Static<typeof AccordionSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
