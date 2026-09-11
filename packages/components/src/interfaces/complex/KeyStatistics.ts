import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { IsomerString } from "../primitives/IsomerString"

export const KeyStatisticsSchema = Type.Object(
  {
    type: Type.Literal("keystatistics", { default: "keystatistics" }),
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
    statistics: Type.Array(
      Type.Object({
        label: IsomerString({
          title: "Description",
        }),
        value: IsomerString({
          title: "Number",
          description: "Keep it succinct, e.g., 3.3%, 880,000, $12M",
        }),
      }),
      {
        title: "Statistics",
        minItems: 1,
        maxItems: 4,
      },
    ),
    label: Type.Optional(
      IsomerString({
        title: "Link text",
        maxLength: 50,
        description:
          "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
      }),
    ),
    url: Type.Optional(
      Type.String({
        title: "Link destination",
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
  },
  {
    groups: [
      {
        label: "Add a call-to-action",
        fields: ["label", "url"],
      },
    ],
    title: "Statistics",
    description: "A component that displays KeyStatistics",
  },
)

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
