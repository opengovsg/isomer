import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { SUPPORTED_ICON_NAMES } from "~/common/icons"

export const InfoBoxSchema = Type.Object({
  title: Type.String({
    title: "Title",
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      maxLength: 300,
    }),
  ),
  icon: Type.Optional(
    Type.Union(
      SUPPORTED_ICON_NAMES.map((icon) =>
        Type.Literal(icon, {
          title:
            icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, " "),
        }),
      ),
      {
        title: "Column icon",
        description: "The icon to display for the column",
        type: "string",
      },
    ),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Link text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
    }),
  ),
})

export const InfoColsSchema = Type.Object(
  {
    type: Type.Literal("infocols", { default: "infocols" }),
    title: Type.String({
      title: "Title",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    infoBoxes: Type.Array(InfoBoxSchema, {
      title: "Content",
      minItems: 1,
      maxItems: 6,
    }),
  },
  {
    title: "Infocols component",
  },
)

export type InfoColsProps = Static<typeof InfoColsSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
