import type { TSchema } from "@sinclair/typebox"
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
interface CreateDgsSchemaProps<T extends TSchema> {
  componentName: string
  nativeSchema: T
}
export const createDgsSchema = <T extends TSchema>({
  componentName,
  nativeSchema,
}: CreateDgsSchemaProps<T>) => {
  const dgsFields = Object.keys(nativeSchema.properties).reduce(
    (acc, key) => {
      const unionSchema = Type.Union([
        nativeSchema.properties[key as keyof T["properties"]],
        Type.String({
          title: "Key",
          description: "The key of the header in DGS table",
        }),
      ])

      // Only make optional if the original property was optional
      acc[key] = isPropertyOptional({
        schema: nativeSchema,
        propertyKey: key,
      })
        ? Type.Optional(unionSchema)
        : unionSchema

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

// Helper function to check if a property is optional in a TypeBox schema
interface IsPropertyOptionalProps {
  schema: TSchema
  propertyKey: string
}
const isPropertyOptional = ({
  schema,
  propertyKey,
}: IsPropertyOptionalProps): boolean => {
  // If the schema has a required array, check if the property is in it
  if (schema.required && Array.isArray(schema.required)) {
    return !schema.required.includes(propertyKey)
  }
  // If no required array is specified, all properties are optional by default in TypeBox
  return true
}
