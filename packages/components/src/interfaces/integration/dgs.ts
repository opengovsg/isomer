import { Type } from "@sinclair/typebox"

import { DGS_ID_STRING_REGEX } from "../../utils/validation"
import { DGS_DATASET_ID_FORMAT } from "../format"
import { DATA_SOURCE_TYPE } from "./dataSource"

// Refer to https://guide.data.gov.sg/developer-guide/dataset-apis/search-and-filter-within-dataset
const DgsDataSourceFieldsSchema = Type.Object({
  type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
    default: DATA_SOURCE_TYPE.dgs,
  }),
  resourceId: Type.String({
    title: "Link a dataset",
    description: "You can only link CSV datasets from Data.gov.sg",
    pattern: DGS_ID_STRING_REGEX,
    errorMessage: {
      pattern: "must start with 'd_' and contain only alphanumeric characters",
    },
    format: DGS_DATASET_ID_FORMAT,
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
