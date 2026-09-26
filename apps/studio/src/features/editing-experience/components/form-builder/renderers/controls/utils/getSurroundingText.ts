const FIELDS_EXCLUDED_FROM_SURROUNDING_TEXT = new Set(["src", "alt", "type"])

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

// Text fields on the same component as the image, such as a caption or
// title. `src`, `alt`, and `type` are not prose, so they are left out.
export const getSurroundingText = (
  component: Record<string, unknown> | undefined,
): string | undefined => {
  if (!component) return undefined

  const text = Object.entries(component)
    .filter(
      ([field, value]) =>
        !FIELDS_EXCLUDED_FROM_SURROUNDING_TEXT.has(field) &&
        isNonEmptyString(value),
    )
    .map(([, value]) => value)
    .join(" ")

  return text || undefined
}
