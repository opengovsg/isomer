import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { DGS_ID_STRING_REGEX } from "../../utils/validation"
import { DGS_DATASET_ID_FORMAT } from "../format"
import { DATA_SOURCE_TYPE } from "./dataSource"

// Refer to https://guide.data.gov.sg/developer-guide/dataset-apis/search-and-filter-within-dataset
export const DgsDataSourceFieldsSchema = Type.Object({
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
  resourceId: Type.String({
    description: "You can only link CSV datasets from Data.gov.sg",
    errorMessage: {
      pattern: "must start with 'd_' and contain only alphanumeric characters",
    },
    format: DGS_DATASET_ID_FORMAT,
    pattern: DGS_ID_STRING_REGEX,
    title: "Link a dataset",
  }),
  sort: Type.Optional(
    Type.String({
      // unlikely to be used for Studio users,
      // so hiding it to reduce complexity of the UI for them
      format: "hidden",
    }),
  ),
  type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
    default: DATA_SOURCE_TYPE.dgs,
  }),
})

export const DgsDataSourceSchema = Type.Object({
  dataSource: DgsDataSourceFieldsSchema,
})

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
  if (schema.required !== undefined && Array.isArray(schema.required)) {
    return !schema.required.includes(propertyKey)
  }
  // If no required array is specified, all properties are optional by default in TypeBox
  return true
}

// Generic helper to create DGS schema from native schema
interface CreateDgsSchemaProps<T extends TSchema> {
  componentName: string
  nativeSchema: T
}
export const createDgsSchema = <T extends TSchema>({
  componentName,
  nativeSchema,
}: CreateDgsSchemaProps<T>) => {
  const dgsFields: Record<string, TSchema> = {}

  for (const key of Object.keys(nativeSchema.properties)) {
    const unionSchema = Type.Union([
      // SAFETY: key comes from Object.keys(nativeSchema.properties)
      nativeSchema.properties[key as keyof T["properties"]],
      Type.String({
        description: "The key of the header in DGS table",
        title: "Key",
      }),
    ])

    // Only make optional if the original property was optional
    dgsFields[key] = isPropertyOptional({
      propertyKey: key,
      schema: nativeSchema,
    })
      ? Type.Optional(unionSchema)
      : unionSchema
  }

  return Type.Intersect([
    Type.Object({
      dataSource: DgsDataSourceFieldsSchema,
    }),
    Type.Object(dgsFields, {
      title: `DGS ${componentName} component`,
    }),
  ])
}
