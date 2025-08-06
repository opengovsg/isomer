import { TSchema, Type } from "@sinclair/typebox"

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
export const DgsDataSourceSchema = Type.Object({
  type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
    default: DATA_SOURCE_TYPE.dgs,
  }),
  resourceId: Type.String({
    title: "DGS Resource ID",
    description: "The resource ID to fetch data from DGS",
  }),
  filters: Type.Optional(
    Type.Array(
      Type.Object({
        fieldKey: Type.String(),
        fieldValue: Type.String(),
      }),
    ),
  ),
  sort: Type.Optional(Type.String()),
})

// Generic helper to create DGS schema from native schema
type CreateDgsSchemaProps<T extends TSchema> = {
  componentName: string
  nativeSchema: T
}
export const createDgsSchema = <T extends TSchema>({
  componentName,
  nativeSchema,
}: CreateDgsSchemaProps<T>) => {
  const dgsFields = Object.keys(nativeSchema.properties).reduce(
    (acc, key) => {
      acc[key] = Type.Optional(
        Type.Union([
          nativeSchema.properties[key as keyof T["properties"]],
          Type.String({
            title: "Key",
            description: "The key of the header in DGS table",
          }),
        ]),
      )
      return acc
    },
    {} as Record<string, any>,
  )

  return Type.Intersect([
    Type.Object({
      dataSource: DgsDataSourceSchema,
    }),
    Type.Object(dgsFields, {
      title: `DGS ${componentName} component`,
    }),
  ])
}
