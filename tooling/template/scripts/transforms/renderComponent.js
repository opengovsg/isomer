/* eslint-env node */
const fs = require("fs")
const path = require("path")
const { COMPONENT_MAPPINGS } = require("@opengovsg/isomer-components")

// Read the schema analysis results
const analysisPath = path.join(__dirname, "..", "..", "schema-analysis.json")

let usedComponentTypes = []
try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"))
  usedComponentTypes = analysis.componentTypes || []
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  throw new Error(`Error reading schema-analysis.json: ${errorMessage}`)
}

// Determine which components are used
const usedComponents = new Set()
const usedCases = new Set()

usedComponentTypes.forEach((type) => {
  const componentName = COMPONENT_MAPPINGS[type]
  if (componentName) {
    usedComponents.add(componentName)
    usedCases.add(type)
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

  // Remove unused import statements (except jsx-runtime)
  root.find(j.ImportDeclaration).forEach((importPath) => {
    const importDecl = importPath.value
    const source = importDecl.source?.value

    if (typeof source !== "string") {
      return
    }

    // Skip jsx-runtime imports
    if (source.includes("jsx-runtime")) {
      return
    }

    if (source.includes("../components/")) {
      const specifiers = importDecl.specifiers || []
      const usedSpecifiers = specifiers.filter((spec) => {
        if (spec.type === "ImportDefaultSpecifier") {
          // Handle default import (Prose)
          return usedComponents.has("Prose")
        }
        if (spec.type === "ImportSpecifier" && spec.imported) {
          const importedName =
            spec.imported.type === "Identifier"
              ? spec.imported.name
              : spec.imported.type === "StringLiteral"
                ? spec.imported.value
                : null
          return importedName ? usedComponents.has(importedName) : false
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

    // Handle string literal cases
    if (caseNode.test.type === "Literal") {
      return typeof caseNode.test.value === "string"
        ? usedCases.has(caseNode.test.value)
        : false
    }

    return false
  })

  return root.toSource()
}
