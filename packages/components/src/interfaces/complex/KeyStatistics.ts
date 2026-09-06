import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const KeyStatisticsSchema = Type.Object(
  {
    id: Type.Optional(
      Type.String({
        description: "The ID to use for anchor links",
        format: "hidden",
        title: "Anchor ID",
      }),
    ),
    label: Type.Optional(
      Type.String({
        description:
          "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
        maxLength: 50,
        title: "Link text",
      }),
    ),
    statistics: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Description",
        }),
        value: Type.String({
          description: "Keep it succinct, e.g., 3.3%, 880,000, $12M",
          title: "Number",
        }),
      }),
      {
        maxItems: 4,
        minItems: 1,
        title: "Statistics",
      },
    ),
    title: Type.String({
      title: "Title",
    }),
    type: Type.Literal("keystatistics", { default: "keystatistics" }),
    url: Type.Optional(
      Type.String({
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Link destination",
      }),
    ),
  },
  {
    description: "A component that displays KeyStatistics",
    groups: [
      {
        fields: ["label", "url"],
        label: "Add a call-to-action",
      },
    ],
    title: "Statistics",
  },
)

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
