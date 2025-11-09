import fs from "fs"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import type {
  IsomerComponent,
  IsomerComponentTypes,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const schemaDir = path.join(__dirname, "..", "schema")

const layouts = new Set<IsomerPageLayoutType>()
const componentTypes = new Set<IsomerComponentTypes>()

/**
 * Recursively extract component types from content array
 * Only extracts top-level component types, not nested prose content types
 */
function extractComponentTypes(content: IsomerComponent[]): void {
  for (const item of content) {
    const componentType = item.type as IsomerComponentTypes
    componentTypes.add(componentType)
  }
}

/**
 * Recursively scan directory for JSON files
 */
function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      scanDirectory(fullPath)
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      try {
        const content = fs.readFileSync(fullPath, "utf8")
        const data = JSON.parse(content) as {
          layout?: IsomerPageLayoutType
          content?: IsomerComponent[]
        }

        // Extract layout
        if (data.layout) {
          layouts.add(data.layout)
        }

        // Extract component types from content array
        if (data.content) {
          extractComponentTypes(data.content)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.warn(`Error parsing ${fullPath}:`, errorMessage)
      }
    }
  }
}

// Scan the schema directory
console.log("Scanning schema directory...")
scanDirectory(schemaDir)

// Convert sets to sorted arrays
const layoutsArray = Array.from(layouts).sort()
const componentTypesArray = Array.from(componentTypes).sort()

// Create output object
const output = {
  layouts: layoutsArray,
  componentTypes: componentTypesArray,
}

// Write to schema-analysis.json
const outputPath = path.join(__dirname, "..", "schema-analysis.json")
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))

console.log(`\nFound ${layoutsArray.length} unique layouts:`)
console.log(layoutsArray)

console.log(`\nFound ${componentTypesArray.length} unique component types:`)
console.log(componentTypesArray)

console.log(`\nResults written to: ${outputPath}`)
