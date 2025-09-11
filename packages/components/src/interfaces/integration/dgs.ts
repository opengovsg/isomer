import { Type } from "@sinclair/typebox"

import { DATA_SOURCE_TYPE } from "./dataSource"

// Refer to https://guide.data.gov.sg/developer-guide/dataset-apis/search-and-filter-within-dataset
const DgsDataSourceFieldsSchema = Type.Object({
  type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
    default: DATA_SOURCE_TYPE.dgs,
  }),
  resourceId: Type.String({
    title: "DGS Dataset ID",
    description: "Navigate to Data.gov.sg and copy the dataset’s ID",
  }),
  filters: Type.Optional(
    Type.Array(
      Type.Object({
        fieldKey: Type.String(),
        fieldValue: Type.String(),
      }),
      {
        // unlikely to be used for Studio users,
        // so hiding it to reduce complexity of the UI for them
        format: "hidden",
      },
    ),
  ),
  sort: Type.Optional(
    Type.String({
      // unlikely to be used for Studio users,
      // so hiding it to reduce complexity of the UI for them
      format: "hidden",
    }),
  ),
})

export const DgsDataSourceSchema = Type.Object({
  dataSource: DgsDataSourceFieldsSchema,
})
