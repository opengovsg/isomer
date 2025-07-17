import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { ARRAY_RADIO_FORMAT } from "../format"

// TODO: maybe also move this outside of this file as a shared interface
export const NATIVE_SEARCHABLE_TABLE_TYPE = "native"
export const DGS_SEARCHABLE_TABLE_TYPE = "dgs"

const KeyStatisticsBaseSchema = Type.Object({
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
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

const StatisticsSchema = Type.Object({
  label: Type.String({
    title: "Description",
    maxLength: 100,
  }),
})

const StatisticSchemaConfig = {
  title: "Statistics",
  minItems: 1,
  maxItems: 4,
}

export const NativeKeyStatisticsSchema = Type.Object(
  {
    dataSource: Type.Optional(
      // optional for backward compatibility
      Type.Literal(NATIVE_SEARCHABLE_TABLE_TYPE, {
        default: NATIVE_SEARCHABLE_TABLE_TYPE,
      }),
    ),
    statistics: Type.Array(
      Type.Composite([
        StatisticsSchema,
        Type.Object({
          value: Type.String({
            title: "Number",
            description: "Keep it succinct. E.g., 3.3%, $12M",
            maxLength: 7,
          }),
        }),
      ]),
      StatisticSchemaConfig,
    ),
  },
  {
    title: "Native",
  },
)

export const DGSKeyStatisticsSchema = Type.Object(
  {
    dataSource: Type.Literal(DGS_SEARCHABLE_TABLE_TYPE, {
      default: DGS_SEARCHABLE_TABLE_TYPE,
    }),
    // 👇👇👇 This is used to identify the dataset ID in DGS
    dgsResourceId: Type.String({
      title: "DGS Resource ID",
      description: "The DGS resource ID to fetch the data from",
    }),
    // 👇👇👇 This is used to identify which row to fetch the data from
    // Needed because while DGS currently has a "_id" field, it's non-deterministic,
    // which will change when new CSV files are uploaded.
    // By putting the column and value in the same object, we create an "artificial" static identifier
    // Limitation: This assumes that the column and value are unique for each row,
    // which might not be the case. However, we will just fetch the first matching row.
    dgsRow: Type.Object({
      dgsFieldKey: Type.String({
        title: "Key",
        description: "The key of the header in DGS table",
      }),
      dgsFieldValue: Type.String({
        title: "Value",
        description: "The value of that cell in that column",
      }),
    }),
    statistics: Type.Array(
      Type.Composite([
        StatisticsSchema,
        Type.Object({
          // 👇👇👇 This tells us which column to fetch the data from
          dgsFieldKey: Type.String({
            title: "Key",
            description: "The key of the header in DGS table",
          }),
        }),
      ]),
      StatisticSchemaConfig,
    ),
  },
  {
    title: "DGS",
  },
)

export const KeyStatisticsSchema = Type.Intersect(
  [
    KeyStatisticsBaseSchema,
    Type.Union(
      [
        NativeKeyStatisticsSchema,
        DGSKeyStatisticsSchema,
        // We can add more data sources here
      ],
      {
        format: ARRAY_RADIO_FORMAT,
        title: "Data Source", // TODO: placeholder, to decide on the name of the field
      },
    ),
  ],
  {
    title: "KeyStatistics component",
    description: "A component that displays KeyStatistics",
  },
)

export type NativeKeyStatisticsProps = Static<typeof KeyStatisticsBaseSchema> &
  Static<typeof NativeKeyStatisticsSchema> & {
    layout: IsomerPageLayoutType
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type DGSKeyStatisticsProps = Static<typeof KeyStatisticsBaseSchema> &
  Static<typeof DGSKeyStatisticsSchema> & {
    layout: IsomerPageLayoutType
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export type KeyStatisticsSkeletonProps = Omit<
  KeyStatisticsProps,
  "statistics"
> & {
  statisticsData: {
    label: string
    value: string | undefined // undefined if the value is not available
  }[]
}

// TODO: to move to somewhere else as shared interface
const DGSSuccessResponse = Type.Object({
  success: Type.Literal(true, { default: true }),
  result: Type.Object({
    resource_id: Type.String(),
    records: Type.Array(Type.Record(Type.String(), Type.Any())),
    total: Type.Number(),
    limit: Type.Number(),
  }),
})
const DGSFailureResponse = Type.Object({
  success: Type.Literal(false, { default: false }),
})
const _DGSResponseSchema = Type.Union([DGSSuccessResponse, DGSFailureResponse])

export type DGSSuccessResponse = Static<typeof DGSSuccessResponse>
export type DGSFailureResponse = Static<typeof DGSFailureResponse>
export type DGSResponse = Static<typeof _DGSResponseSchema>
