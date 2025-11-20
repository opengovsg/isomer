import type { ScopedSchemaLayout } from "@opengovsg/isomer-components"
import { getScopedSchema } from "@opengovsg/isomer-components"
import clone from "lodash/clone"

import { ajv } from "./ajv"

// Global cache for compiled AJV schemas to avoid expensive recompilation
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>()

type GetScopedSchemaParams<T extends ScopedSchemaLayout> = Parameters<
  typeof getScopedSchema<T>
>[0]

interface GetCachedScopedSchemaProps<T extends ScopedSchemaLayout> {
  layout: T
  scope: GetScopedSchemaParams<T>["scope"]
  exclude?: string[]
}
export function getCachedScopedSchema<T extends ScopedSchemaLayout>({
  layout,
  scope,
  exclude,
}: GetCachedScopedSchemaProps<T>): ReturnType<typeof ajv.compile> {
  const sortedExclude = exclude ? clone(exclude).sort().join(",") : ""
  const cacheKey = `${layout}:${scope}:${sortedExclude}`

  const cachedSchema = schemaCache.get(cacheKey)
  if (cachedSchema) return cachedSchema

  const scopedSchema = getScopedSchema({
    layout,
    scope,
    exclude,
  })

  const compiledSchema = ajv.compile(scopedSchema)

  schemaCache.set(cacheKey, compiledSchema)

  return compiledSchema
}
