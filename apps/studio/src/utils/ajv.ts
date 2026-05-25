import Ajv from "ajv"
import addErrors from "ajv-errors"

import { addUniqueItemPropertiesIgnoreCase } from "./ajvKeywords/uniqueItemPropertiesIgnoreCase"

export const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
  discriminator: true,
})
addErrors(ajv)
addUniqueItemPropertiesIgnoreCase(ajv)
