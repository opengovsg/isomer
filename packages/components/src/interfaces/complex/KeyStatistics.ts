import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const KeyStatisticsSchema = Type.Object(
  {
    type: Type.Literal("keystatistics"),
    variant: Type.Union([Type.Literal("side"), Type.Literal("top")], {
      title: "KeyStatistics variant",
      description: "The variant of the KeyStatistics component to use",
    }),
    title: Type.String({
      title: "KeyStatistics title",
      description: "The title of the KeyStatistics component",
    }),
    statistics: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Statistic label",
          description: "The label for the statistic",
        }),
        value: Type.String({
          title: "Statistic value",
          description: "The value for the statistic",
        }),
      }),
      {
        title: "KeyStatistics statistics",
        minItems: 1,
        maxItems: 4,
      },
    ),
  },
  {
    title: "KeyStatistics component",
    description: "A component that displays KeyStatistics",
  },
)

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema>
