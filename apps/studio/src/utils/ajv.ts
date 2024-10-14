import Ajv from "ajv"

export const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
