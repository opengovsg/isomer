/* eslint-disable no-undef */
const {
  schema,
  DividerSchema,
  ParagraphSchema,
  OrderedListSchema,
  UnorderedListSchema,
  ProseSchema,
} = require("@opengovsg/isomer-components")
const fs = require("fs")
const path = require("path")

/**
 * This script generates a JSON schema file for the Isomer JSON Schema. It is
 * kept in the docs/next folder so that POEs can use the schema in third-party
 * form builders when migrating content to Isomer Next.
 */

const jsonOutput = JSON.stringify(
  {
    ...schema,
    components: {
      divider: DividerSchema,
      paragraph: ParagraphSchema,
      orderedList: OrderedListSchema,
      unorderedList: UnorderedListSchema,
      prose: ProseSchema,
    },
  },
  null,
  2,
)
  // Replace all references via IDs to references via the schema path
  .replace(/"\$ref": "components-native-/g, '"$ref": "#/components/')
  // Remove all instances of $id since we no longer need it
  .replace(/^.*\$id.*\n?/gm, "")
const outputPath = path.resolve(__dirname, "../../../docs/next", "0.1.0.json")

fs.writeFileSync(outputPath, jsonOutput, "utf8")
console.log(`Isomer JSON schema file has been generated at ${outputPath}`)
