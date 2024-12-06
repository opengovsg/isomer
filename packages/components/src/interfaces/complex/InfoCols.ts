import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { SUPPORTED_ICON_NAMES } from "~/common/icons"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const InfoBoxSchema = Type.Object({
  title: Type.String({
    title: "Title",
    maxLength: 100,
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      maxLength: 200,
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
        type: "string",
      },
    ),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Link text",
      maxLength: 50,
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

export const InfoColsSchema = Type.Object(
  {
    type: Type.Literal("infocols", { default: "infocols" }),
    id: Type.Optional(
      Type.String({
        title: "Anchor ID",
        description: "The ID to use for anchor links",
        format: "hidden",
      }),
    ),
    title: Type.String({
      title: "Title",
      maxLength: 100,
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Description",
        maxLength: 150,
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
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
