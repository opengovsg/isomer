import type { StringOptions } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { NO_STYLIZED_UNICODE_REGEX } from "~/utils/validation"

const NO_STYLIZED_UNICODE_ERROR_MESSAGE =
  "cannot contain stylised or decorative unicode characters"

// One copy of the lookahead. Every `IsomerString` points at this `$id`.
// The object has to be reachable from each document Ajv compiles on its own
// (`componentSchemaDefinitions`) or registered with `ajv.addSchema`.
export const NO_STYLIZED_UNICODE_STRING_ID = "isomer-string-no-stylized-unicode"

export const NoStylizedUnicodeStringSchema = Type.String({
  $id: NO_STYLIZED_UNICODE_STRING_ID,
  pattern: NO_STYLIZED_UNICODE_REGEX,
  errorMessage: {
    pattern: NO_STYLIZED_UNICODE_ERROR_MESSAGE,
  },
})

// Drop-in replacement for `Type.String` that additionally rejects stylized
// unicode lookalikes. The caller's `pattern`, `format`, `title`, and
// `errorMessage` stay on this node. The unicode check is a separate `$ref`,
// so a `|` inside the caller's pattern cannot skip it.
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
