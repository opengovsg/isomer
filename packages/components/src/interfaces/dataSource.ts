import { Type } from "@sinclair/typebox"

export const DATA_SOURCE_TYPE = {
  native: "native",
  dgs: "dgs",
} as const

export const NativeDataSourceSingleRecordSchema = Type.Object({
  // "optional" to ensure backward compatibility
  dataSource: Type.Optional(
    Type.Object({
      type: Type.Literal(DATA_SOURCE_TYPE.native, {
        default: DATA_SOURCE_TYPE.native,
      }),
    }),
  ),
})

// Refer to https://guide.data.gov.sg/developer-guide/dataset-apis/search-and-filter-within-dataset
const DgsFieldSchema = Type.Object({
  fieldKey: Type.String(),
  fieldValue: Type.String(),
})
export const DgsDataSourceSingleRecordSchema = Type.Object({
  dataSource: Type.Object({
    type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
      default: DATA_SOURCE_TYPE.dgs,
    }),
    resourceId: Type.String(),
    row: DgsFieldSchema,
    filters: Type.Optional(Type.Array(DgsFieldSchema)),
    sort: Type.Optional(Type.String()),
  }),
})
