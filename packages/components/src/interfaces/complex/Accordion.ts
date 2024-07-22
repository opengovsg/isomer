import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { InnerProseSchema } from "../native/Prose"



export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: Type.String({
      title: "Accordion summary",
      description: "The summary for the accordion",
    }),
    details: InnerProseSchema,
  },
  { title: "Accordion component" },
)

export type AccordionProps = Static<typeof AccordionSchema>
