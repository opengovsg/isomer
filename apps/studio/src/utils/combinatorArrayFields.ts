import type { IsomerSchema } from "@opengovsg/isomer-components"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { pick } from "lodash-es"

interface JsonSchema {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema | JsonSchema[]
  const?: unknown
  oneOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  allOf?: JsonSchema[]
}

function objectArrayItemSchema(propSchema: JsonSchema): JsonSchema | undefined {
  const itemSchema = Array.isArray(propSchema.items)
    ? undefined
    : propSchema.items
  return itemSchema?.properties ? itemSchema : undefined
}

function mapObjectArrayFields(
  data: Record<string, unknown> | undefined,
  schema: JsonSchema,
  mapItems: (items: unknown[], itemSchema: JsonSchema) => unknown[],
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    const itemSchema = objectArrayItemSchema(propSchema)
    const oldItems = data?.[key]
    if (!itemSchema || !Array.isArray(oldItems)) {
      continue
    }
    mapped[key] = mapItems(oldItems, itemSchema)
  }

  return mapped
}

export function keepMatchingArrayFields(
  oldData: Record<string, unknown> | undefined,
  newSchema: JsonSchema,
): Record<string, unknown> {
  return mapObjectArrayFields(oldData, newSchema, (items) => items)
}

function pickMatchingArrayFields(
  data: Record<string, unknown> | undefined,
  schema: JsonSchema,
): Record<string, unknown> {
  return mapObjectArrayFields(data, schema, (items, itemSchema) => {
    const allowedKeys = Object.keys(itemSchema.properties ?? {})
    return items.map((item) =>
      item !== null && typeof item === "object" && !Array.isArray(item)
        ? pick(item, allowedKeys)
        : item,
    )
  })
}

function combinatorBranches(schema: JsonSchema | undefined): JsonSchema[] {
  if (!schema) {
    return []
  }
  if (schema.oneOf) {
    return schema.oneOf
  }
  if (schema.anyOf) {
    return schema.anyOf
  }
  for (const subSchema of schema.allOf ?? []) {
    const nested = combinatorBranches(subSchema)
    if (nested.length > 0) {
      return nested
    }
  }
  return []
}

function matchesCombinatorBranch(
  data: Record<string, unknown>,
  branch: JsonSchema,
): boolean {
  let hasConstField = false
  for (const [key, propSchema] of Object.entries(branch.properties ?? {})) {
    if (propSchema.const === undefined) {
      continue
    }
    hasConstField = true
    if (data[key] !== propSchema.const) {
      return false
    }
  }
  return hasConstField
}

function matchingCombinatorBranch(
  schema: JsonSchema,
  data: Record<string, unknown>,
): JsonSchema | undefined {
  return combinatorBranches(schema).find((branch) =>
    matchesCombinatorBranch(data, branch),
  )
}

export function stripInactiveCombinatorFields(
  page: IsomerSchema,
): IsomerSchema {
  return {
    ...page,
    content: page.content.map((block) => {
      const blockData = block as unknown as Record<string, unknown>
      const schema = getComponentSchema({
        component: block.type,
        layout: page.layout,
      }) as JsonSchema
      const branch = matchingCombinatorBranch(schema, blockData)
      if (!branch) {
        return block
      }
      return {
        ...block,
        ...pickMatchingArrayFields(blockData, branch),
      }
    }),
  }
}

export function serializePageBlob(page: IsomerSchema): string {
  return JSON.stringify(stripInactiveCombinatorFields(page))
}
