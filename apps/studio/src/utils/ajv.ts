import Ajv from "ajv"
import addErrors from "ajv-errors"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: false,
  strict: false,
  logger: false,
  discriminator: true,
})
addErrors(ajv)
