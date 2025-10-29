import { getScopedSchema } from "@opengovsg/isomer-components"

import { ajv } from "./ajv"

// Global cache for compiled AJV schemas to avoid expensive recompilation
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>()

interface GetCachedScopedSchemaProps<T extends string> {
  layout: T
  scope: string
  exclude?: string[]
}
export function getCachedScopedSchema<T extends string>(
  props: GetCachedScopedSchemaProps<T>,
): ReturnType<typeof ajv.compile> {
  const { layout, scope, exclude } = props

  const cacheKey = `${layout}:${scope}:${exclude?.sort().join(",") || ""}`

  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!
  }

  const scopedSchema = getScopedSchema({
    layout: layout as any, // TODO: fix this any
    scope,
    exclude,
  })

  const compiledSchema = ajv.compile(scopedSchema)

  schemaCache.set(cacheKey, compiledSchema)

  return compiledSchema
}
