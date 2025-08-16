import { Type } from "@sinclair/typebox"

import { DATA_SOURCE_TYPE } from "./dataSource"

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
