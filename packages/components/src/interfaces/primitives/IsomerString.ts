import type { StringOptions } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { NO_STYLIZED_UNICODE_REGEX } from "~/utils/validation"

const NO_STYLIZED_UNICODE_ERROR_MESSAGE =
  "cannot contain stylised or decorative unicode characters"

// One stylized-unicode pattern; each IsomerString field $refs this $id.
export const NO_STYLIZED_UNICODE_STRING_ID = "isomer-string-no-stylized-unicode"

export const NoStylizedUnicodeStringSchema = Type.String({
  $id: NO_STYLIZED_UNICODE_STRING_ID,
  pattern: NO_STYLIZED_UNICODE_REGEX,
  errorMessage: {
    pattern: NO_STYLIZED_UNICODE_ERROR_MESSAGE,
  },
})

// Type.String plus stylized-unicode rejection. Caller pattern, format, title,
// and errorMessage stay on this node. Unicode validation is a separate $ref,
// so alternation in the caller pattern cannot bypass it.
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
    ...(existingPattern ? { pattern: existingPattern } : {}),
    ...(errorMessage ? { errorMessage } : {}),
    allOf: [{ $ref: NO_STYLIZED_UNICODE_STRING_ID }],
  })
}
