import type { Static, TSchema } from "@sinclair/typebox"

import type { ISOMER_USABLE_PAGE_LAYOUTS } from "../types/constants"
import {
  ArticlePageSchema,
  CollectionPageSchema,
  ContentPageSchema,
  DatabasePageSchema,
  FileRefSchema,
  HomePageSchema,
  IndexPageSchema,
  LinkRefSchema,
} from "../types/schema"
import { componentSchemaDefinitions } from "./components"

type ScopedSchemaLayout =
  (typeof ISOMER_USABLE_PAGE_LAYOUTS)[keyof typeof ISOMER_USABLE_PAGE_LAYOUTS]

const LAYOUT_SCHEMA_MAP = {
  article: ArticlePageSchema,
  collection: CollectionPageSchema,
  content: ContentPageSchema,
  database: DatabasePageSchema,
  file: FileRefSchema,
  homepage: HomePageSchema,
  index: IndexPageSchema,
  link: LinkRefSchema,
} as const satisfies Record<ScopedSchemaLayout, TSchema>

// Utility type to extract all possible dot-separated paths from an object type
// This recursively builds paths like "page", "page.database", "page.contentPageHeader", etc.
// Number here is the depth of the schema (how deep we want to go)
// Arbitrarily keeping it at 2 level deep because:
// 1. No use case for deeper than that
// 2. Performance: Each level of recursion creates exponential combinations and slows down typechecking
type PathsToStringProps<T, Depth extends number = 2> = [Depth] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string
          ?
              | `${K}`
              | (PathsToStringProps<T[K], Prev[Depth]> extends infer R
                  ? R extends string
                    ? `${K}.${R}`
                    : never
                  : never)
          : never
      }[keyof T]
    : never

// decrement depth counter to prevent infinite recursion
type Prev = [never, 0, 1, 2, 3]

type SchemaPathsFrom<T extends TSchema> = PathsToStringProps<Static<T>>

interface ScopeLayoutMap {
  database: SchemaPathsFrom<typeof DatabasePageSchema>
  article: SchemaPathsFrom<typeof ArticlePageSchema>
  content: SchemaPathsFrom<typeof ContentPageSchema>
  collection: SchemaPathsFrom<typeof CollectionPageSchema>
  homepage: SchemaPathsFrom<typeof HomePageSchema>
  index: SchemaPathsFrom<typeof IndexPageSchema>
  link: SchemaPathsFrom<typeof LinkRefSchema>
  file: SchemaPathsFrom<typeof FileRefSchema>
}

interface FilterableSchemaObject extends TSchema {
  properties?: Record<string, TSchema>
  required?: string[]
  allOf?: FilterableSchemaObject[]
}

type FilterMode = "include" | "exclude"

const shouldKeepField = (
  field: string,
  fieldSet: Set<string>,
  mode: FilterMode,
): boolean => (mode === "include" ? fieldSet.has(field) : !fieldSet.has(field))

const hasPropertiesRecord = (
  schema: FilterableSchemaObject,
): schema is FilterableSchemaObject & {
  properties: Record<string, TSchema>
} => {
  const { properties } = schema
  return properties !== undefined && !Array.isArray(properties)
}

const filterRequiredFields = (
  schema: FilterableSchemaObject,
  fieldSet: Set<string>,
  mode: FilterMode,
): void => {
  if (Array.isArray(schema.required)) {
    const filteredRequired = schema.required.filter((field) =>
      shouldKeepField(field, fieldSet, mode),
    )
    if (filteredRequired.length > 0) {
      schema.required = filteredRequired
    } else {
      delete schema.required
    }
  }
}

// Filters a single schema object's properties and required fields.
// Returns null if all properties were removed.
const filterSchemaProperties = (
  schema: FilterableSchemaObject,
  fieldSet: Set<string>,
  mode: FilterMode,
): FilterableSchemaObject | null => {
  if (!hasPropertiesRecord(schema)) {
    return schema
  }
  const filteredProperties: Record<string, TSchema> = {}
  for (const [key, value] of Object.entries(schema.properties)) {
    if (shouldKeepField(key, fieldSet, mode)) {
      filteredProperties[key] = value
    }
  }
  if (Object.keys(filteredProperties).length === 0) {
    return null
  }
  const result = {
    ...schema,
    properties: filteredProperties,
  } satisfies FilterableSchemaObject
  filterRequiredFields(result, fieldSet, mode)
  return result
}

const buildFieldSet = (
  include: string[] | undefined,
  exclude: string[] | undefined,
): Set<string> | null => {
  if ((include?.length ?? 0) > 0) {
    return new Set(include)
  }
  if ((exclude?.length ?? 0) > 0) {
    return new Set(exclude)
  }
  return null
}

/**
 * ```ts
 * // ✅ Valid - "page.database" exists in DatabasePageSchema
 * const schema = getScopedSchema({ layout: "database", scope: "page.database" })

 * // ❌ Type error - "page.database" doesn't exist in ArticlePageSchema
 * const schema = getScopedSchema({ layout: "article", scope: "page.database" })
 *
 * // ✅ Exclude specific fields from the schema
 * const schema = getScopedSchema({
 *   layout: "database",
 *   scope: "page",
 *   exclude: ["contentPageHeader", "database"]
 * })
 * ```
 */
export const getScopedSchema = <T extends ScopedSchemaLayout>({
  layout,
  scope,
  exclude,
  include,
}: {
  layout: T
  scope: T extends keyof ScopeLayoutMap ? ScopeLayoutMap[T] : never
  exclude?: string[]
  include?: string[]
}): TSchema => {
  if ((exclude?.length ?? 0) > 0 && (include?.length ?? 0) > 0) {
    throw new Error(
      "getScopedSchema: 'include' and 'exclude' are mutually exclusive — specify one or neither",
    )
  }

  // root schema
  let currentSchema: FilterableSchemaObject = LAYOUT_SCHEMA_MAP[layout]

  for (const part of scope.split(".")) {
    // just in case runtime error occurs (should not be since we control what's passed in)
    if (!currentSchema.properties?.[part]) {
      throw new Error(
        `Invalid scope path: "${scope}". Property "${part}" not found in schema for layout "${layout}"`,
      )
    }
    // SAFETY: existence validated by guard above; nested layout property is always a TypeBox schema.
    currentSchema = currentSchema.properties[part]
  }

  const fieldSet = buildFieldSet(include, exclude)
  const mode: FilterMode = (include?.length ?? 0) > 0 ? "include" : "exclude"

  if (fieldSet) {
    if (currentSchema.allOf) {
      const filteredAllOf = []
      for (const subSchema of currentSchema.allOf) {
        const filtered = filterSchemaProperties(subSchema, fieldSet, mode)
        if (filtered) {
          filteredAllOf.push(filtered)
        }
      }

      return {
        ...currentSchema,
        ...componentSchemaDefinitions,
        allOf: filteredAllOf,
      }
    }

    if (currentSchema.properties) {
      const result = filterSchemaProperties(currentSchema, fieldSet, mode) ?? {
        ...currentSchema,
        properties: {},
      }
      return {
        ...result,
        ...componentSchemaDefinitions,
      }
    }
  }

  return {
    ...currentSchema,
    ...componentSchemaDefinitions,
  }
}
