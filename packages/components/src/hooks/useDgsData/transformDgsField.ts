const PREFIX = "[dgs:" as const
const SUFFIX = "]" as const

// check if the string is a DGS field
// it should match the format [dgs:field_key]
const isStringDgs = (string: string): boolean => {
  return string.startsWith(PREFIX) && string.endsWith(SUFFIX)
}

// remove the "[dgs" prefix and the ending "]"
const extractDgsFieldKey = (string: string): string => {
  return string.slice(PREFIX.length, -SUFFIX.length).trim()
}

export const transformDgsField = <T extends string | undefined | null>(
  field: T,
  record: Record<string, unknown>,
): T => {
  try {
    if (!field || !isStringDgs(field)) {
      return field
    }
    return record[extractDgsFieldKey(field)] as T
  } catch {
    return field
  }
}
