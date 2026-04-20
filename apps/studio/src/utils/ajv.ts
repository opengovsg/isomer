import Ajv from "ajv"
import addErrors from "ajv-errors"

import { registerUniqueItemPropertiesIgnoreCase } from "./ajvUniqueItemPropertiesIgnoreCase"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
  discriminator: true,
})
addErrors(ajv)
registerUniqueItemPropertiesIgnoreCase(ajv)
