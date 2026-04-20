import type Ajv from "ajv"

/**
 * Custom AJV keyword: `uniqueItemPropertiesIgnoreCase: ["label", ...]`
 *
 * - **When:** Attached to an array schema (e.g. tag options). Each element should be an object
 *   with string fields listed in the keyword value.
 * - **Rule:** For each listed field, no two elements may have the same value after trim +
 *   lowercase. Comparison only — stored JSON is not modified.
 * - **Compile time:** We require each field’s `items.properties.<field>` to be `type: "string"`
 *   and to set `isomerUniqueStringCompare: "ignoreCase"` so schemas stay explicit (see
 *   `packages/components/src/types/page.ts`).
 * - **Runtime:** Non-objects and non-string values at that key are skipped for that slot (same
 *   idea as “only validate strings”).
 */
const KEYWORD = "uniqueItemPropertiesIgnoreCase" as const

type ItemProperties = Record<string, Record<string, unknown> | undefined>

/** JSON Schema `type` for a string field (not a runtime typeof check). */
function isSchemaStringType(
  prop: Record<string, unknown> | undefined,
): boolean {
  return prop?.type === "string"
}

function assertIgnoreCaseStringKeys(
  keys: string[],
  parentSchema: Record<string, unknown>,
): void {
  const items = parentSchema.items as
    | { properties?: ItemProperties }
    | undefined
  const props = items?.properties
  if (!props) {
    throw new Error(`${KEYWORD}: parent schema must define items.properties`)
  }
  for (const key of keys) {
    const prop = props[key]
    if (!prop) {
      throw new Error(`${KEYWORD}: missing items.properties.${key}`)
    }
    if (!isSchemaStringType(prop)) {
      throw new Error(
        `${KEYWORD}: items.properties.${key} must be type "string"`,
      )
    }
    if (prop.isomerUniqueStringCompare !== "ignoreCase") {
      throw new Error(
        `${KEYWORD}: add isomerUniqueStringCompare: "ignoreCase" to items.properties.${key}`,
      )
    }
  }
}

/** `String` primitives only (not `String` objects). */
function isStringPrimitive(value: unknown): value is string {
  return Object.prototype.toString.call(value) === "[object String]"
}

/** Plain objects only — excludes arrays, null, dates, etc., which we do not treat as option rows. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

/** Trim + lowercase; used for comparison only (stored values are unchanged). */
function normalizedStringForCompare(raw: string): string {
  return raw.trim().toLowerCase()
}

function readStringProperty(
  item: unknown,
  propertyKey: string,
): string | undefined {
  if (!isPlainObject(item)) return undefined
  const value = item[propertyKey]
  return isStringPrimitive(value) ? value : undefined
}

/**
 * True when two or more array elements have the same normalized string for `propertyKey`.
 * Slots without a string at that key do not participate (no error for that index).
 */
function hasDuplicateNormalizedValues(
  arrayItems: unknown[],
  propertyKey: string,
): boolean {
  const seen = new Set<string>()
  for (const item of arrayItems) {
    const raw = readStringProperty(item, propertyKey)
    if (raw === undefined) continue
    const normalized = normalizedStringForCompare(raw)
    if (seen.has(normalized)) return true
    seen.add(normalized)
  }
  return false
}

/**
 * AJV `compile` hook: runs once per place the keyword appears in the schema.
 * Returns the function that validates each actual array instance in the JSON being validated.
 */
function compileUniqueItemPropertiesIgnoreCase(
  propertyKeys: string[],
  parentSchema: Record<string, unknown>,
) {
  assertIgnoreCaseStringKeys(propertyKeys, parentSchema)
  return (instanceData: unknown): boolean => {
    // Trivially unique: empty or one element.
    if (!Array.isArray(instanceData) || instanceData.length <= 1) {
      return true
    }
    // Each keyword entry is an independent uniqueness constraint (e.g. only `label` today).
    for (const propertyKey of propertyKeys) {
      if (hasDuplicateNormalizedValues(instanceData, propertyKey)) {
        return false
      }
    }
    return true
  }
}

export function registerUniqueItemPropertiesIgnoreCase(ajv: Ajv): void {
  ajv.addKeyword({
    keyword: KEYWORD,
    type: "array",
    schemaType: "array",
    compile: compileUniqueItemPropertiesIgnoreCase,
    metaSchema: {
      type: "array",
      items: { type: "string" },
    },
  })
}
