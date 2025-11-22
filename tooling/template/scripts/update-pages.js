const fs = require("fs").promises
const path = require("path")
const recast = require("recast")
const { namedTypes: n } = require("ast-types")

const SITEMAP_ANALYSIS = path.join(__dirname, "../sitemap-analysis.json")
const APP_DIR = path.join(__dirname, "../app")

const PAGE_FILE_NAME = "page.tsx"

// Mapping of component types to import names
const COMPONENT_IMPORTS = {
  accordion: "Accordion",
  blockquote: "Blockquote",
  callout: "Callout",
  childrenpages: "ChildrenPages",
  collectionblock: "CollectionBlock",
  contactinformation: "ContactInformation",
  contentpic: "Contentpic",
  dynamiccomponentlist: "DynamicComponentList",
  dynamicdatabanner: "DynamicDataBanner",
  formsg: "FormSG",
  hero: "Hero",
  iframe: "Iframe",
  image: "Image",
  imagegallery: "ImageGallery",
  infobar: "Infobar",
  infocards: "InfoCards",
  infocols: "InfoCols",
  infopic: "Infopic",
  keystatistics: "KeyStatistics",
  logocloud: "LogoCloud",
  map: "Map",
  prose: "Prose",
  video: "Video",
}

// Mapping of layout types to import names
const LAYOUT_IMPORTS = {
  article: "ArticleLayoutSkeleton",
  collection: "CollectionLayout",
  content: "ContentLayoutSkeleton",
  database: "DatabaseLayoutSkeleton",
  homepage: "HomepageLayoutSkeleton",
  index: "IndexPageLayoutSkeleton",
  notfound: "NotFoundLayout",
  search: "SearchLayout",
}

// Get the permalink array from a page.tsx file path
// Example: app/contact/page.tsx -> ["contact"]
// Example: app/the-president/former-presidents/page.tsx -> ["the-president", "former-presidents"]
// Example: app/page.tsx -> [] (empty array for root)
const getPermalinkFromPath = (filePath) => {
  const relativePath = path.relative(APP_DIR, filePath)

  // Handle root page.tsx
  if (relativePath === PAGE_FILE_NAME) {
    return []
  }

  // Remove /page.tsx from the end
  const routePath = relativePath.replace(/\/page\.tsx$/, "").replace(/\\/g, "/")

  // If empty after removing page.tsx, it's root
  if (routePath === "") {
    return []
  }

  // Split by / and filter out empty strings
  return routePath.split("/").filter(Boolean)
}

// Get the route path from a page.tsx file path
const getRouteFromPath = (filePath) => {
  const relativePath = path.relative(APP_DIR, filePath)
  // Handle both root-level page.tsx and nested page.tsx files
  let routePath = relativePath.replace(/\/?page\.tsx$/, "").replace(/\\/g, "/")
  // Remove trailing slashes
  routePath = routePath.replace(/\/+$/, "")
  // If routePath is empty (root-level page.tsx), return "/"
  // Otherwise ensure it starts with "/"
  return routePath === "" ? "/" : "/" + routePath
}

// Collect all used layouts and components from sitemap analysis
const collectUsedItems = (sitemapAnalysis, routePath) => {
  const usedLayouts = new Set()
  const usedComponents = new Set()

  const pageData = sitemapAnalysis[routePath]
  if (pageData) {
    usedLayouts.add(pageData.layout)
    pageData.components.forEach((comp) => usedComponents.add(comp))
  }

  return { usedLayouts, usedComponents }
}

// Update STATIC_ROUTE_PERMALINK constant in a file using AST
const updateStaticRoutePermalink = (ast, permalink) => {
  const b = recast.types.builders
  let found = false

  recast.visit(ast, {
    visitVariableDeclarator(path) {
      const node = path.node

      // Look for STATIC_ROUTE_PERMALINK constant
      if (
        n.Identifier.check(node.id) &&
        node.id.name === "STATIC_ROUTE_PERMALINK"
      ) {
        found = true

        // Create the new value: array of string literals
        const arrayElements = permalink.map((segment) => b.literal(segment))

        // Create array expression: [segment1, segment2, ...]
        const arrayExpression = b.arrayExpression(arrayElements)

        // Update the init value
        node.init = arrayExpression

        return false // Stop traversing
      }

      this.traverse(path)
    },
  })

  return found
}

// Remove unused imports using AST
const removeUnusedImports = (ast, usedLayouts, usedComponents) => {
  const b = recast.types.builders

  // Find and remove unused import declarations
  recast.visit(ast, {
    visitImportDeclaration(path) {
      const node = path.node
      const source = node.source.value

      // Check if this is a layout or component import
      const isLayoutImport = source.includes("/layouts/")
      const isComponentImport = source.includes("/components/")

      if (!isLayoutImport && !isComponentImport) {
        this.traverse(path)
        return
      }

      // Filter specifiers to keep only used ones
      const keptSpecifiers = []

      if (node.specifiers) {
        for (const specifier of node.specifiers) {
          if (n.ImportSpecifier.check(specifier)) {
            const importName = specifier.imported.name
            let shouldKeep = false

            if (isLayoutImport) {
              // Check if this layout is used
              for (const [layoutType, layoutImportName] of Object.entries(
                LAYOUT_IMPORTS,
              )) {
                if (
                  importName === layoutImportName &&
                  usedLayouts.has(layoutType)
                ) {
                  shouldKeep = true
                  break
                }
              }
            } else if (isComponentImport) {
              // Check if this component is used
              for (const [componentType, componentImportName] of Object.entries(
                COMPONENT_IMPORTS,
              )) {
                if (
                  importName === componentImportName &&
                  usedComponents.has(componentType)
                ) {
                  shouldKeep = true
                  break
                }
              }
            }

            if (shouldKeep) {
              keptSpecifiers.push(specifier)
            }
          } else {
            // Keep default imports
            keptSpecifiers.push(specifier)
          }
        }
      }

      // Remove the import if no specifiers remain
      if (keptSpecifiers.length === 0) {
        path.prune()
      } else {
        node.specifiers = keptSpecifiers
      }

      this.traverse(path)
    },
  })

  return ast
}

// Helper function to process switch statements in a function body
const processSwitchInFunction = (
  funcBody,
  funcName,
  usedLayouts,
  usedComponents,
) => {
  recast.visit(funcBody, {
    visitSwitchStatement(switchPath) {
      const switchNode = switchPath.node
      const discriminant = switchNode.discriminant

      // Process renderNextLayout switch for props.layout
      if (
        funcName === "renderNextLayout" &&
        n.MemberExpression.check(discriminant) &&
        discriminant.object?.name === "props" &&
        discriminant.property?.name === "layout"
      ) {
        // Filter cases to keep only used ones
        const keptCases = []

        for (let i = 0; i < switchNode.cases.length; i++) {
          const caseNode = switchNode.cases[i]

          if (!caseNode.test) {
            // Default case - always keep
            keptCases.push(caseNode)
            continue
          }

          if (n.Literal.check(caseNode.test)) {
            const caseValue = caseNode.test.value

            // Skip "file" and "link" cases - they're not valid layouts
            if (caseValue === "file" || caseValue === "link") {
              continue
            }

            // Keep if used
            if (usedLayouts.has(caseValue)) {
              keptCases.push(caseNode)
            }
          } else {
            // Keep other types of test expressions
            keptCases.push(caseNode)
          }
        }

        // Update the cases array
        if (keptCases.length < switchNode.cases.length) {
          switchNode.cases = keptCases
        }
      }

      // Process renderComponent switch for component.type
      if (
        funcName === "renderComponent" &&
        n.MemberExpression.check(discriminant) &&
        discriminant.object?.name === "component" &&
        discriminant.property?.name === "type"
      ) {
        // Filter cases to keep only used ones
        const keptCases = []

        for (let i = 0; i < switchNode.cases.length; i++) {
          const caseNode = switchNode.cases[i]

          if (!caseNode.test) {
            // Default case - always keep
            keptCases.push(caseNode)
            continue
          }

          if (n.Literal.check(caseNode.test)) {
            const caseValue = caseNode.test.value

            // Keep if used
            if (usedComponents.has(caseValue)) {
              keptCases.push(caseNode)
            }
          } else {
            // Keep other types of test expressions
            keptCases.push(caseNode)
          }
        }

        // Update the cases array
        if (keptCases.length < switchNode.cases.length) {
          switchNode.cases = keptCases
        }
      }

      this.traverse(switchPath)
    },
  })
}

// Remove unused switch cases using AST
const removeUnusedSwitchCases = (ast, usedLayouts, usedComponents) => {
  recast.visit(ast, {
    // Handle function declarations: function renderNextLayout() { ... }
    visitFunctionDeclaration(path) {
      const funcName = path.node.id?.name

      if (funcName === "renderNextLayout" || funcName === "renderComponent") {
        if (path.node.body && n.BlockStatement.check(path.node.body)) {
          processSwitchInFunction(
            path.node.body,
            funcName,
            usedLayouts,
            usedComponents,
          )
        }
      }

      this.traverse(path)
    },

    // Handle const declarations: const renderNextLayout = () => { ... }
    visitVariableDeclarator(path) {
      const varName = path.node.id?.name

      if (varName === "renderNextLayout" || varName === "renderComponent") {
        const init = path.node.init

        // Handle arrow functions: () => { ... }
        if (
          n.ArrowFunctionExpression.check(init) &&
          n.BlockStatement.check(init.body)
        ) {
          processSwitchInFunction(
            init.body,
            varName,
            usedLayouts,
            usedComponents,
          )
        }

        // Handle function expressions: function() { ... }
        if (
          n.FunctionExpression.check(init) &&
          n.BlockStatement.check(init.body)
        ) {
          processSwitchInFunction(
            init.body,
            varName,
            usedLayouts,
            usedComponents,
          )
        }
      }

      this.traverse(path)
    },
  })

  return ast
}

// Process a single page.tsx file
const processPageFile = async (filePath, sitemapAnalysis) => {
  const permalink = getPermalinkFromPath(filePath)
  const routePath = getRouteFromPath(filePath)

  const { usedLayouts, usedComponents } = collectUsedItems(
    sitemapAnalysis,
    routePath,
  )

  const content = await fs.readFile(filePath, "utf8")

  // Skip if file doesn't contain STATIC_ROUTE_PERMALINK
  if (!content.includes("STATIC_ROUTE_PERMALINK")) {
    return false
  }

  try {
    // Parse the file into an AST
    const ast = recast.parse(content, {
      parser: {
        parse: (source) => {
          const parser = require("@babel/parser")
          return parser.parse(source, {
            sourceType: "module",
            plugins: [
              "typescript",
              "jsx",
              "decorators-legacy",
              "classProperties",
              "objectRestSpread",
            ],
            tokens: true,
          })
        },
      },
    })

    // Update the STATIC_ROUTE_PERMALINK constant
    updateStaticRoutePermalink(ast, permalink)

    // Remove unused imports
    removeUnusedImports(ast, usedLayouts, usedComponents)

    // Remove unused switch cases (both layout and component)
    removeUnusedSwitchCases(ast, usedLayouts, usedComponents)

    // Generate new code
    let newContent
    try {
      newContent = recast.print(ast, {
        quote: "double",
        tabWidth: 2,
        trailingComma: true,
        wrapColumn: 80,
        reuseWhitespace: false,
      }).code
    } catch (printError) {
      console.error(`Error printing AST for ${filePath}:`, printError.message)
      console.error(`  This might indicate an AST structure issue.`)
      // Try with default options as fallback
      try {
        newContent = recast.print(ast).code
      } catch (fallbackError) {
        throw new Error(
          `Failed to print AST: ${printError.message}. Fallback also failed: ${fallbackError.message}`,
        )
      }
    }

    // Only write if content changed
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, "utf8")
      return true
    }

    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    if (error.message.includes("regular expression")) {
      console.error(
        `  This might be a JSX parsing issue. Line number in error may not match actual line.`,
      )
      console.error(`  Full error:`, error.stack)
    }
    return false
  }
}

// Recursively find all page.tsx files
const findPageFiles = async (dir) => {
  const files = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const subFiles = await findPageFiles(fullPath)
      files.push(...subFiles)
    } else if (entry.name === PAGE_FILE_NAME) {
      files.push(fullPath)
    }
  }

  return files
}

const main = async () => {
  try {
    console.log("Reading sitemap-analysis.json...")
    const sitemapAnalysisContent = await fs.readFile(SITEMAP_ANALYSIS, "utf8")
    const sitemapAnalysis = JSON.parse(sitemapAnalysisContent)

    console.log(`Finding all ${PAGE_FILE_NAME} files...`)
    const pageFiles = await findPageFiles(APP_DIR)
    let updatedCount = 0

    console.log("Updating permalinks, imports and switch cases...\n")
    for (const filePath of pageFiles) {
      const routePath = getRouteFromPath(filePath)
      const updated = await processPageFile(filePath, sitemapAnalysis)
      if (updated) {
        updatedCount++
        console.log(`✓ Updated ${routePath}`)
      }
    }

    if (updatedCount === 0) {
      console.log("\nNote: No files were updated.")
    } else {
      console.log(`\n✓ Updated ${updatedCount} file(s)`)
    }
  } catch (error) {
    console.error("Error:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
