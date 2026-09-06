/* oxlint-disable anti-slop/no-unknown-parameters -- DGS field keys resolve to string values in the row record */
/* oxlint-disable typescript/no-unsafe-type-assertion, anti-slop/no-runtime-typeof -- DGS field keys resolve to string values in the row record */
const PREFIX = "[dgs:" as const
const SUFFIX = "]" as const

// check if the string is a DGS field
// it should match the format [dgs:field_key]
const isStringDgs = (string: string): boolean =>
  string.startsWith(PREFIX) && string.endsWith(SUFFIX)

// remove the "[dgs" prefix and the ending "]"
const extractDgsFieldKey = (string: string): string =>
  string.slice(PREFIX.length, -SUFFIX.length).trim()

type DgsFieldRecord = Record<string, string | number>

export const transformDgsField = (
  field: unknown,
  record: DgsFieldRecord,
): string | undefined | null => {
  try {
    if (field === undefined || field === null) {
      return field
    }
    if (typeof field !== "string") {
      return undefined
    }
    if (field === "" || !isStringDgs(field)) {
      return field
    }
    const transformedValue = record[extractDgsFieldKey(field)]
    // SAFETY: DGS field keys resolve to string values in the row record
    return typeof transformedValue === "string" ||
      typeof transformedValue === "number"
      ? String(transformedValue)
      : undefined
  } catch {
    return typeof field === "string" ? field : undefined
  }
}
