import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"

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
    title: Type.String({
      title: "Title",
      maxLength: 100,
    }),
    statistics: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Description",
          maxLength: 100,
        }),
        value: Type.String({
          title: "Number",
          description: "Keep it succinct. E.g., 3.3%, $12M",
          maxLength: 7,
        }),
      }),
      {
        title: "Statistics",
        minItems: 1,
        maxItems: 4,
      },
    ),
    label: Type.Optional(
      Type.String({
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
    title: "KeyStatistics component",
    description: "A component that displays KeyStatistics",
  },
)

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
}
