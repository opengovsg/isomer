import { isObject, isPlainObject, mapValues } from "lodash-es"

import type { EmailTemplate, EmailTemplateMap } from "../templates/types"
import { escapeHtml } from "./html"

type EscapedTemplateArguments<T extends EmailTemplateMap> = {
  [K in keyof T]: (data: Parameters<T[K]>[0]) => EmailTemplate
}

// Escape user-controlled `data` before render. Prefer this over escaping
// subject/body, which would break intentional HTML in the template.
export const escapeTemplateArguments = <T extends EmailTemplateMap>(
  templates: T,
): EscapedTemplateArguments<T> =>
  mapValues(
    templates,
    (template) => (data: Parameters<T[keyof T]>[0]) =>
      template(escapeTemplateArgument(data)),
  )

const escapeTemplateArgument = <T>(value: T): T => {
  if (typeof value === "string") {
    return escapeHtml(value) as T
  }

  if (Array.isArray(value)) {
    return value.map(escapeTemplateArgument) as T
  }

  if (value instanceof Date) {
    return value
  }

  if (isPlainObject(value)) {
    return mapValues(value as object, escapeTemplateArgument) as T
  }

  if (isObject(value)) {
    throw new Error("Cannot escape a non-plain object")
  }

  return value
}
