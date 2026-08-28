import { schema } from "@opengovsg/isomer-components"
import fs from "node:fs"
import path from "node:path"

/**
 * This script generates a JSON schema file for the Isomer JSON Schema. It is
 * kept in the docs/next folder so that POEs can use the schema in third-party
 * form builders when migrating content to Isomer Next.
 */

const jsonOutput = JSON.stringify(schema, null, 2)
  // Replace all references via IDs to references via the schema path
  .replace(/"\$ref": "components-native-/g, '"$ref": "#/components/native/')
  // Remove all instances of $id since we no longer need it
  .replace(/^.*\$id.*\n?/gm, "")
const outputPath = path.resolve("public", "0.1.0.json")

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, jsonOutput + "\n", "utf8")
console.log(`Isomer JSON schema file has been generated at ${outputPath}`)
