import type { SchemaValidateFunction } from "ajv"
import type Ajv from "ajv"

export const UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD =
  "uniqueItemPropertiesIgnoreCase"

export function addUniqueItemPropertiesIgnoreCase(ajv: Ajv): void {
  const validate: SchemaValidateFunction = function (
    schema: string[],
    data: unknown[],
  ) {
    validate.errors = []

    if (!Array.isArray(data) || !Array.isArray(schema) || schema.length === 0)
      return true

    for (const prop of schema) {
      const seen = new Map<string, number>()
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (typeof item !== "object" || item === null) continue
        const raw = (item as Record<string, unknown>)[prop]
        if (typeof raw !== "string") continue
        const normalized = raw.trim().toLowerCase()
        if (seen.has(normalized)) {
          validate.errors.push({
            keyword: UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD,
            message: `duplicate value "${raw.trim()}" for property "${prop}" (case-insensitive)`,
            params: {
              prop,
              value: raw.trim(),
              duplicateOf: seen.get(normalized),
            },
          })
        } else {
          seen.set(normalized, i)
        }
      }
    }

    return validate.errors.length === 0
  }

  ajv.addKeyword({
    keyword: UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD,
    type: "array",
    schemaType: "array",
    errors: true,
    validate,
  })
}
