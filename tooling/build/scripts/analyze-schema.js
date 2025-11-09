const fs = require("fs")
const path = require("path")

const schemaDir = path.join(__dirname, "..", "schema")
const layouts = new Set()
const componentTypes = new Set()

/**
 * Recursively extract component types from content array
 * Only extracts top-level component types, not nested prose content types
 */
function extractComponentTypes(content) {
  if (!Array.isArray(content)) {
    return
  }

  for (const item of content) {
    if (item && typeof item === "object" && item.type) {
      // Add the component type
      componentTypes.add(item.type)

      // Handle nested content in certain components (like callout with prose content)
      // But we don't want to extract prose internal types like "paragraph", "heading", etc.
      if (item.content && Array.isArray(item.content)) {
        // Only recurse if it's a component that might have nested components
        // Skip prose content recursion to avoid extracting "paragraph", "heading", etc.
        if (item.type !== "prose") {
          extractComponentTypes(item.content)
        }
      }
    }
  }
}

/**
 * Recursively scan directory for JSON files
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      scanDirectory(fullPath)
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      try {
        const content = fs.readFileSync(fullPath, "utf8")
        const data = JSON.parse(content)

        // Extract layout
        if (data.layout) {
          layouts.add(data.layout)
        }

        // Extract component types from content array
        if (data.content && Array.isArray(data.content)) {
          extractComponentTypes(data.content)
        }
      } catch (error) {
        console.warn(`Error parsing ${fullPath}:`, error.message)
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
