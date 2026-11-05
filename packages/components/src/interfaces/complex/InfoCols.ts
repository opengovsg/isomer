import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { IconPicker } from "../primitives/IconPicker"
import { IsomerString } from "../primitives/IsomerString"

const InfoBoxSchema = Type.Object({
  title: IsomerString({
    title: "Title",
  }),
  description: Type.Optional(
    IsomerString({
      title: "Description",
    }),
  ),
  icon: Type.Optional(IconPicker()),
  buttonLabel: Type.Optional(
    IsomerString({
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
    title: IsomerString({
      title: "Title",
    }),
    subtitle: Type.Optional(
      IsomerString({
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
    title: "Columns of text",
  },
)

export type InfoColsProps = Static<typeof InfoColsSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
