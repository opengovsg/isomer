import type { FuncKeywordDefinition } from "ajv"

/** Matches duplicate detection in indicesWithDuplicateLabels (trim + lowercase); non-strings yield empty key and are skipped. */
function normalizedKey(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

function getDef(): FuncKeywordDefinition {
  return {
    keyword: "uniqueItemPropertiesIgnoreCase",
    type: "array",
    schemaType: "array",
    compile(keys: string[]) {
      return (data: unknown) => {
        if (!Array.isArray(data) || data.length <= 1) return true
        for (const key of keys) {
          const seen = new Set<string>()
          for (const item of data) {
            if (!item || typeof item !== "object") continue
            const normalized = normalizedKey(
              (item as Record<string, unknown>)[key],
            )
            if (!normalized) continue
            if (seen.has(normalized)) return false
            seen.add(normalized)
          }
        }
        return true
      }
    },
    metaSchema: {
      type: "array",
      items: { type: "string" },
    },
  }
}

/** Case-insensitive uniqueness for listed object properties (no data mutation). */
export default function addUniqueItemPropertiesIgnoreCaseKeyword(ajv: {
  addKeyword: (def: FuncKeywordDefinition) => unknown
}) {
  return ajv.addKeyword(getDef())
}

export const UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD =
  "uniqueItemPropertiesIgnoreCase" as const
