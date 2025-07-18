import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const DGS_DATA_SOURCE = "dgs"

const DGSDataSourceSchema = Type.Object({
  type: Type.Literal(DGS_DATA_SOURCE, { default: DGS_DATA_SOURCE }),
  // 👇👇👇 This is used to identify the dataset ID in DGS
  resourceId: Type.String({
    title: "DGS Resource ID",
    description: "The resource ID to fetch data from DGS",
  }),
  // 👇👇👇 This is used to identify which row to fetch the data from
  // Needed because while DGS currently has a "_id" field, it's non-deterministic,
  // which will change when new CSV files are uploaded.
  // By putting the column and value in the same object, we create an "artificial" static identifier
  // Limitation: This assumes that the column and value are unique for each row,
  // which might not be the case. However, we will just fetch the first matching row.
  row: Type.Object({
    fieldKey: Type.String({
      title: "Field Key",
      description: "The field key to fetch data from DGS",
    }),
    fieldValue: Type.String({
      title: "Field Value",
      description: "The value to display for the field",
    }),
  }),
})

const DataSourceSchema = Type.Union([
  DGSDataSourceSchema,
  // TODO: Add other data sources here
])

export const KeyStatisticsSchema = Type.Object(
  {
    type: Type.Literal("keystatistics", { default: "keystatistics" }),
    dataSource: Type.Optional(DataSourceSchema),
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
    title: "KeyStatistics component",
    description: "A component that displays KeyStatistics",
  },
)

export type DGSKeyStatisticsProps = Omit<
  Static<typeof KeyStatisticsSchema>,
  "dataSource"
> & {
  dataSource: Static<typeof DGSDataSourceSchema>
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export type KeyStatisticsProps = Static<typeof KeyStatisticsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
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
