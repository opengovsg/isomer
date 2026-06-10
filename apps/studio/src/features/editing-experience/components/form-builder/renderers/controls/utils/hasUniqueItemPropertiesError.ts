import type { ErrorObject } from "ajv"

/** Map of AJV `instancePath` → errors, as produced by FormBuilder’s `groupBy(errors, "instancePath")`. */
type BuilderErrorsByInstancePath = Record<string, ErrorObject[] | undefined>

/**
 * JsonForms uses dotted paths; AJV / `hasErrorAt` use JSON Pointer-style paths.
 *
 * @see {@link ../../ErrorProvider ErrorProvider}
 */
function jsonFormsPathToAjvInstancePath(path: string): string {
  return `/${path.replace(/\./g, "/")}`
}

/** Array-level duplicate label among items (`uniqueItemProperties`). */
export function hasUniqueItemPropertiesError({
  errors,
  jsonFormsPath,
}: {
  errors: BuilderErrorsByInstancePath
  jsonFormsPath: string
}): boolean {
  return (
    errors[jsonFormsPathToAjvInstancePath(jsonFormsPath)]?.some(
      (e) => e.keyword === "uniqueItemProperties",
    ) ?? false
  )
}
