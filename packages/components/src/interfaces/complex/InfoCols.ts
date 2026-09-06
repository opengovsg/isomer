import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { SUPPORTED_ICON_NAMES } from "~/common/icons"
import { LINK_HREF_PATTERN } from "~/utils/validation"

const InfoBoxSchema = Type.Object({
  buttonLabel: Type.Optional(
    Type.String({
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      maxLength: 50,
      title: "Link text",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Link destination",
    }),
  ),
  description: Type.Optional(
    Type.String({
      title: "Description",
    }),
  ),
  icon: Type.Optional(
    Type.Union(
      SUPPORTED_ICON_NAMES.map((icon) =>
        Type.Literal(icon, {
          title:
            icon.charAt(0).toUpperCase() + icon.slice(1).replaceAll("-", " "),
        }),
      ),
      {
        title: "Column icon",
        type: "string",
      },
    ),
  ),
  title: Type.String({
    title: "Title",
  }),
})

export const InfoColsSchema = Type.Object(
  {
    id: Type.Optional(
      Type.String({
        description: "The ID to use for anchor links",
        format: "hidden",
        title: "Anchor ID",
      }),
    ),
    infoBoxes: Type.Array(InfoBoxSchema, {
      maxItems: 6,
      minItems: 1,
      title: "Content",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    title: Type.String({
      title: "Title",
    }),
    type: Type.Literal("infocols", { default: "infocols" }),
  },
  {
    title: "Columns of text",
  },
)

export type InfoColsProps = Static<typeof InfoColsSchema> & {
  // NOTE: Remove this property, only used in classic theme
  sectionIdx?: number
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
