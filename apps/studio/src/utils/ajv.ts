import Ajv from "ajv"
import addErrors from "ajv-errors"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
})
addErrors(ajv)
