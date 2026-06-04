import { isPlainObject } from "lodash-es"

import type { EmailTemplate } from "../templates/types"
import { escapeHtml } from "./escapeHtml"

// Wraps each template so `data` is escaped before render (not subject/body—that would break intentional HTML).
export const escapeTemplateArguments = <
  const T extends Record<string, (data: never) => EmailTemplate>,
>(
  templates: T,
): T =>
  Object.fromEntries(
    Object.entries(templates).map(([name, template]) => [
      name,
      (data: never) =>
        (template as (data: never) => EmailTemplate)(
          escapeTemplateArgument(data),
        ),
    ]),
  ) as unknown as T

// Escapes strings in `data` recursively; leaves dates, primitives, and non-plain objects unchanged.
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
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([key, nestedValue]) => [key, escapeTemplateArgument(nestedValue)],
      ),
    ) as T
  }

  return value
}
