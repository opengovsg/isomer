import { schema } from "@opengovsg/isomer-components"
import fs from "node:fs"
import path from "node:path"

/**
 * Generates the Isomer JSON schema served by the playground at
 * `public/0.1.0.json`. The editor fetches this file at runtime for validation.
 */

const jsonOutput = JSON.stringify(schema, null, 2)
  // Replace all references via IDs to references via the schema path
  .replace(/"\$ref": "components-native-/g, '"$ref": "#/components/native/')
  // Remove top-level "$id": "..." property lines from the stringified schema
  .replace(/^\s*"\$id":\s*"[^"]*",?\s*\n/gm, "")
const outputPath = path.resolve("public", "0.1.0.json")

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, jsonOutput + "\n", "utf8")
console.log(`Isomer JSON schema file has been generated at ${outputPath}`)
