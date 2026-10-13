import Ajv from "ajv"
import addErrors from "ajv-errors"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
  discriminator: true,
  // NOTE: NO_STYLIZED_UNICODE_REGEX (packages/components) blocks astral-plane
  // ranges (e.g. Mathematical Alphanumeric Symbols) via bare UTF-16 surrogate
  // pair literals, which only match without the regex `u` flag. Ajv defaults
  // `unicodeRegExp` to true and compiles `pattern` with `u`, which silently
  // no-ops those checks. Keep this false so `pattern` keeps UTF-16 semantics.
  unicodeRegExp: false,
})
addErrors(ajv)
