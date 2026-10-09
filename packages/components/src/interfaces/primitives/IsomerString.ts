import type { StringOptions } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { NO_STYLIZED_UNICODE_REGEX } from "~/utils/validation"

const NO_STYLIZED_UNICODE_ERROR_MESSAGE =
  "cannot contain stylised or decorative unicode characters"

// Drop-in replacement for `Type.String` that additionally rejects stylized
// unicode lookalikes (see `NO_STYLIZED_UNICODE_REGEX` in ~/utils/validation).
// If the caller already passes a `pattern`, the two checks are joined into
// one regex — the caller's pattern is wrapped in a non-capturing group first
// so alternation inside it (e.g. `LINK_HREF_PATTERN`'s
// `(^https://)|(^tel:)|...`) can't silently only bind to part of the combined
// pattern. `errorMessage.pattern` is joined the same way, since a single
// combined `pattern` keyword can no longer tell AJV which half failed.
export const IsomerString = (options: StringOptions = {}) => {
  const {
    pattern: existingPattern,
    errorMessage,
    ...rest
  } = options as StringOptions & {
    errorMessage?: { pattern?: string; [key: string]: unknown }
  }

  return Type.String({
    ...rest,
    pattern: existingPattern
      ? `${NO_STYLIZED_UNICODE_REGEX}(?:${existingPattern})`
      : NO_STYLIZED_UNICODE_REGEX,
    errorMessage: {
      ...errorMessage,
      pattern: errorMessage?.pattern
        ? `${errorMessage.pattern}; ${NO_STYLIZED_UNICODE_ERROR_MESSAGE}`
        : NO_STYLIZED_UNICODE_ERROR_MESSAGE,
    },
  })
}
