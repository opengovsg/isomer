import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const KeyStatisticsSchema = Type.Object(
  {
    type: Type.Literal("keystatistics", { default: "keystatistics" }),
    title: Type.String({
      title: "Title",
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
        }),
      }),
      {
        title: "Statistics",
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
