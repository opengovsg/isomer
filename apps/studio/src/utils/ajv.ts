import { NoStylizedUnicodeStringSchema } from "@opengovsg/isomer-components"
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
  // `IsomerString` is an `allOf` `$ref` to one shared pattern schema. The
  // default `inlineRefs: true` pastes that schema back into every string
  // while generating code, which reintroduces the per-field lookahead.
  inlineRefs: false,
})
addErrors(ajv)
// Lets the `$ref` in every `IsomerString` resolve, whichever schema is compiled.
ajv.addSchema(NoStylizedUnicodeStringSchema)
