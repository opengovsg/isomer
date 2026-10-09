import { NoStylizedUnicodeStringSchema } from "~/interfaces/primitives/IsomerString"

// Schemas that IsomerString $refs. Merged into the page schema so compiles
// without spreading componentSchemaDefinitions still resolve them.
export const isomerSharedSchemaDefinitions = {
  noStylizedUnicodeString: NoStylizedUnicodeStringSchema,
}
