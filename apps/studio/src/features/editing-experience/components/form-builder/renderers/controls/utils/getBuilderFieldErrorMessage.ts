import type { ErrorObject } from "ajv"

import { getCustomErrorMessage } from "./getCustomErrorMessage"

export const pathToInstancePath = (path: string): string =>
  `/${path.replace(/\./g, "/")}`

/** JsonForms hides some AJV errors inside hero oneOf; ErrorProvider keeps the full set. */
export const getBuilderFieldErrorMessage = (
  path: string,
  jsonFormsErrorMessage: string | undefined,
  errorsByInstancePath: Record<string, ErrorObject[]>,
): string => {
  const fromJsonForms = getCustomErrorMessage(jsonFormsErrorMessage)
  if (fromJsonForms) {
    return fromJsonForms
  }

  const fieldErrors = errorsByInstancePath[pathToInstancePath(path)]
  const message = fieldErrors?.[0]?.message

  return getCustomErrorMessage(message)
}
