import type { ErrorObject } from "ajv"
import { UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD } from "~/utils/ajvKeywords/uniqueItemPropertiesIgnoreCase"

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

/** Array-level duplicate label among items (`uniqueItemProperties` or `uniqueItemPropertiesIgnoreCase`). */
export function hasUniqueItemPropertiesError({
  errors,
  jsonFormsPath,
}: {
  errors: BuilderErrorsByInstancePath
  jsonFormsPath: string
}): boolean {
  return (
    errors[jsonFormsPathToAjvInstancePath(jsonFormsPath)]?.some(
      (e) =>
        e.keyword === "uniqueItemProperties" ||
        e.keyword === UNIQUE_ITEM_PROPERTIES_IGNORE_CASE_KEYWORD,
    ) ?? false
  )
}
