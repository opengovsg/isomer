import { NoStylizedUnicodeStringSchema } from "~/interfaces/primitives/IsomerString"

// Add the next shared check here. `IsomerString` stores a `$ref`. This object
// is copied onto the published page schema so it resolves standalone.
export const isomerSharedSchemaDefinitions = {
  noStylizedUnicodeString: NoStylizedUnicodeStringSchema,
}
