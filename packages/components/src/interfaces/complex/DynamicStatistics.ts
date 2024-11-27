import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const DYNAMIC_STATISTICS_TYPE = "dynamicstatistics"

// Hardcoded for now because
// 1. MUIS is the only use case and there's always 6 prayer timeslots
// 2. No other known use cases have been identified
export const NUMBER_OF_STATISTICS = 6

export const DynamicStatisticsSchema = Type.Object(
  {
    type: Type.Literal(DYNAMIC_STATISTICS_TYPE, {
      default: DYNAMIC_STATISTICS_TYPE,
    }),
    apiEndpoint: Type.String({
      title: "API endpoint",
      description: "The API endpoint to fetch the data from",
      format: "uri",
    }),
    title: Type.Object({
      key: Type.String({
        title: "Key",
        description: "Unique identifier in the JSON e.g. '2024-11-27'",
        maxLength: 100,
      }),
    }),
    statistics: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Description",
          description: "Descriptive label e.g. 'Maghrib'",
          maxLength: 100,
        }),
        key: Type.String({
          title: "Key",
          description: "Unique identifier in the JSON e.g. 'maghrib_time'",
          maxLength: 100,
        }),
      }),
      {
        title: "Statistics",
        minItems: NUMBER_OF_STATISTICS,
        maxItems: NUMBER_OF_STATISTICS,
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
        label: "Map API endpoint",
        fields: ["apiEndpoint", "title", "statistics"],
      },
      {
        label: "Add a call-to-action",
        fields: ["label", "url"],
      },
    ],
    title: "DynamicStatistics component",
    description: "A component that displays DynamicStatistics",
  },
)

export type DynamicStatisticsProps = Static<typeof DynamicStatisticsSchema>
