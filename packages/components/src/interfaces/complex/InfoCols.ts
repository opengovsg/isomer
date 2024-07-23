import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { SUPPORTED_ICON_NAMES } from "~/common/icons"

export const InfoBoxSchema = Type.Object({
  title: Type.String({
    title: "Column title",
    description: "The title of the column",
  }),
  description: Type.Optional(
    Type.String({
      title: "Column content",
      description: "The content of the column",
    }),
  ),
  icon: Type.Optional(
    Type.Union(
      SUPPORTED_ICON_NAMES.map((icon) => Type.Literal(icon)),
      {
        title: "Column icon",
        description: "The icon to display for the column",
        type: "string",
      },
    ),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Button label",
      description: "The label of the button",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Button URL",
      description: "The URL the button should navigate to",
    }),
  ),
})

export const InfoColsSchema = Type.Object(
  {
    type: Type.Literal("infocols", { default: "infocols" }),
    title: Type.String({
      title: "Infocols title",
      description: "The title of the Infocols component",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Infocols subtitle",
        description: "The subtitle of the Infocols component",
      }),
    ),
    backgroundColor: Type.Optional(
      Type.Union([Type.Literal("white"), Type.Literal("gray")], {
        title: "Infocols background color",
        description: "The background color to use for the Infocols component",
        type: "string",
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button label",
        description: "The label of the button",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button URL",
        description: "The URL the button should navigate to",
      }),
    ),
    infoBoxes: Type.Array(InfoBoxSchema, {
      title: "Infocols columns",
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
  LinkComponent?: any // Next.js link
}
