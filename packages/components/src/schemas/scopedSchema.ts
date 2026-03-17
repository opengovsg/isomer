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

const LAYOUT_SCHEMA_MAP: Record<ScopedSchemaLayout, TSchema> = {
  article: ArticlePageSchema,
  content: ContentPageSchema,
  database: DatabasePageSchema,
  homepage: HomePageSchema,
  index: IndexPageSchema,
  link: LinkRefSchema,
  collection: CollectionPageSchema,
  file: FileRefSchema,
} as const

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
export function getScopedSchema<T extends ScopedSchemaLayout>({
  layout,
  scope,
  exclude,
}: {
  layout: T
  scope: T extends keyof ScopeLayoutMap ? ScopeLayoutMap[T] : never
  exclude?: string[] // no typing as it complex and expensive to derive + this is a best-effort argument that is tolerant to invalid inputs
}): TSchema {
  let currentSchema = LAYOUT_SCHEMA_MAP[layout] // root schema

  for (const part of scope.split(".")) {
    // just in case runtime error occurs (should not be since we control what's passed in)
    if (!currentSchema.properties?.[part]) {
      throw new Error(
        `Invalid scope path: "${scope}". Property "${part}" not found in schema for layout "${layout}"`,
      )
    }
    currentSchema = currentSchema.properties[part] as TSchema
  }

  // If exclude is provided, remove the specified fields from the schema
  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(exclude)

    // Handle allOf: filter properties from each sub-schema
    if (currentSchema.allOf) {
      const filteredAllOf = currentSchema.allOf
        .map((subSchema: Record<string, unknown>) => {
          if (
            subSchema.properties &&
            typeof subSchema.properties === "object"
          ) {
            const filteredProperties = { ...subSchema.properties } as Record<
              string,
              unknown
            >
            for (const fieldToExclude of excludeSet) {
              delete filteredProperties[fieldToExclude]
            }
            if (Object.keys(filteredProperties).length === 0) {
              return null
            }
            const result: Record<string, unknown> = {
              ...subSchema,
              properties: filteredProperties,
            }
            if (Array.isArray(subSchema.required)) {
              const filteredRequired = subSchema.required.filter(
                (field: string) => !excludeSet.has(field),
              )
              if (filteredRequired.length > 0) {
                result.required = filteredRequired
              } else {
                delete result.required
              }
            }
            return result
          }
          return subSchema
        })
        .filter(Boolean)

      return {
        ...currentSchema,
        ...componentSchemaDefinitions,
        allOf: filteredAllOf,
      } as TSchema
    }

    if (currentSchema.properties) {
      const filteredProperties = { ...currentSchema.properties }

      for (const fieldToExclude of excludeSet) {
        delete filteredProperties[fieldToExclude]
      }

      const result: Record<string, unknown> = {
        ...currentSchema,
        ...componentSchemaDefinitions,
        properties: filteredProperties,
      }
      if (Array.isArray(currentSchema.required)) {
        const filteredRequired = currentSchema.required.filter(
          (field: string) => !excludeSet.has(field),
        )
        if (filteredRequired.length > 0) {
          result.required = filteredRequired
        } else {
          delete result.required
        }
      }

      return result as TSchema
    }
  }

  return {
    ...currentSchema,
    ...componentSchemaDefinitions,
  } as TSchema
}
