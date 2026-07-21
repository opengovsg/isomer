import { isObject, isPlainObject, mapValues } from "lodash-es"

import type { EmailTemplate, EmailTemplateMap } from "../templates/types"
import { escapeHtml } from "./escapeHtml"

type EscapedTemplateArguments<T extends EmailTemplateMap> = {
  [K in keyof T]: (data: Parameters<T[K]>[0]) => EmailTemplate
}

// Escapes template `data` before rendering the template to prevent XSS attacks.
// This is useful for templates that accept user input, such as resource titles, site names, etc.
// Preferred over escaping the subject/body as that would break intentional HTML.
export const escapeTemplateArguments = <T extends EmailTemplateMap>(
  templates: T,
): EscapedTemplateArguments<T> => {
  const result = {} as EscapedTemplateArguments<T>

  for (const key of Object.keys(templates) as (keyof T & string)[]) {
    const template = templates[key]
    if (template) {
      result[key] = (data: Parameters<T[keyof T]>[0]) =>
        template(escapeTemplateArgument(data))
    }
  }

  return result
}

// Escapes a template argument to prevent XSS attacks.
// Handles strings, arrays, dates, and plain objects recursively.
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
