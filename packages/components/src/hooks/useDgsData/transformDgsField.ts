/* oxlint-disable typescript/no-unsafe-type-assertion -- DGS field keys resolve to string values in the row record */
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

export const transformDgsField = <T extends string | undefined | null>(
  field: T,
  record: DgsFieldRecord,
): T => {
  try {
    if (
      field === undefined ||
      field === null ||
      field === "" ||
      !isStringDgs(field)
    ) {
      return field
    }
    const transformedValue = record[extractDgsFieldKey(field)]
    // SAFETY: DGS field keys resolve to string values in the row record
    const resolvedField: T = transformedValue as T
    return resolvedField
  } catch {
    return field
  }
}
