import type { ScopedSchemaLayout } from "@opengovsg/isomer-components"
import { getScopedSchema } from "@opengovsg/isomer-components"
import clone from "lodash/clone"

import { ajv } from "./ajv"

// Global cache for compiled AJV schemas to avoid expensive recompilation
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>()

interface GetCachedScopedSchemaProps {
  layout: ScopedSchemaLayout
  scope: string
  exclude?: string[]
}
export function getCachedScopedSchema({
  layout,
  scope,
  exclude,
}: GetCachedScopedSchemaProps): ReturnType<typeof ajv.compile> {
  const sortedExclude = exclude ? clone(exclude).sort().join(",") : ""
  const cacheKey = `${layout}:${scope}:${sortedExclude}`

  const cachedSchema = schemaCache.get(cacheKey)
  if (cachedSchema) return cachedSchema

  const scopedSchema = getScopedSchema({
    layout: layout as any, // TODO: fix this any
    scope,
    exclude,
  })

  const compiledSchema = ajv.compile(scopedSchema)

  schemaCache.set(cacheKey, compiledSchema)

  return compiledSchema
}
