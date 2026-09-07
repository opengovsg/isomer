import Ajv from "ajv"
import addErrors from "ajv-errors"

export const ajv = new Ajv({
  allErrors: true,
  discriminator: true,
  logger: false,
  strict: false,
  useDefaults: true,
})
addErrors(ajv)
