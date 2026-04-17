import Ajv from "ajv"
import addErrors from "ajv-errors"
import ajvKeywords from "ajv-keywords"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
  discriminator: true,
})
addErrors(ajv)
ajvKeywords(ajv, ["uniqueItemProperties"])
