import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

export const InfobarSchema = Type.Object(
  {
    type: Type.Literal("infobar", { default: "infobar" }),
    title: Type.String({
      title: "Title",
    }),
    description: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button text",
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button destination",
        description: "When this is clicked, open:",
        format: "link",
      }),
    ),
    secondaryButtonLabel: Type.Optional(
      Type.String({
        title: "Secondary button text",
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      }),
    ),
    secondaryButtonUrl: Type.Optional(
      Type.String({
        title: "Secondary button destination",
        description: "When this is clicked, open:",
        format: "link",
      }),
    ),
  },
  {
    title: "Infobar component",
  },
)

export type InfobarProps = Static<typeof InfobarSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  subtitle?: string // Subtitle that is only used in the classic theme
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
