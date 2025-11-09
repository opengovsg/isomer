/* eslint-env node */
const fs = require("fs")
const path = require("path")
const { LAYOUT_MAPPINGS } = require("@opengovsg/isomer-components")

// Read the schema analysis results
const analysisPath = path.join(__dirname, "..", "..", "schema-analysis.json")
let usedLayouts = []
try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"))
  usedLayouts = analysis.layouts || []
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  throw new Error(`Error reading schema-analysis.json: ${errorMessage}`)
}

// Determine which layouts are used
const usedLayoutComponents = new Set()
const usedLayoutCases = new Set()

usedLayouts.forEach((layout) => {
  const componentName = LAYOUT_MAPPINGS[layout]
  if (componentName) {
    usedLayoutComponents.add(componentName)
    usedLayoutCases.add(layout)
  }
})

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Find the switch statement
  const switchStatements = root.find(j.SwitchStatement)

  if (switchStatements.length === 0) {
    return root.toSource()
  }

  // Remove unused import statements
  root.find(j.ImportDeclaration).forEach((importPath) => {
    const importDecl = importPath.value
    const source = importDecl.source?.value

    if (typeof source === "string" && source.includes("../layouts/")) {
      const specifiers = importDecl.specifiers || []
      const usedSpecifiers = specifiers.filter((spec) => {
        if (spec.type === "ImportSpecifier" && spec.imported) {
          const importedName =
            spec.imported.type === "Identifier"
              ? spec.imported.name
              : spec.imported.type === "StringLiteral"
                ? spec.imported.value
                : null
          return importedName ? usedLayoutComponents.has(importedName) : false
        }
        return false
      })

      if (usedSpecifiers.length === 0) {
        // Remove entire import if no specifiers left
        j(importPath).remove()
      } else if (usedSpecifiers.length < specifiers.length) {
        // Update import with only used specifiers
        importPath.value.specifiers = usedSpecifiers
      }
    }
  })

  // Remove unused case statements
  const switchPath = switchStatements.paths()[0]
  if (!switchPath) {
    return root.toSource()
  }

  const switchNode = switchPath.value
  switchNode.cases = switchNode.cases.filter((caseNode) => {
    if (caseNode.test === null) {
      // Keep default case
      return true
    }

    if (caseNode.test.type === "Literal") {
      const caseValue = caseNode.test.value
      return typeof caseValue === "string"
        ? usedLayoutCases.has(caseValue)
        : false
    }

    return false
  })

  return root.toSource()
}
