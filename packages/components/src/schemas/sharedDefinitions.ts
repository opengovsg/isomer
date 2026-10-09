import { NoStylizedUnicodeStringSchema } from "~/interfaces/primitives/IsomerString"

// Add the next shared check here. `IsomerString` stores a `$ref`. This object
// is copied onto each document that Ajv compiles on its own.
export const isomerSharedSchemaDefinitions = {
  noStylizedUnicodeString: NoStylizedUnicodeStringSchema,
}

export const attachIsomerSharedDefinitions = <T extends object>(schema: T) => {
  const record = schema as T & Record<string, unknown>
  const alreadyAttached = Object.entries(isomerSharedSchemaDefinitions).every(
    ([key, value]) => record[key] === value,
  )
  if (alreadyAttached) return schema

  return {
    ...schema,
    ...isomerSharedSchemaDefinitions,
  }
}
