const fs = require("fs").promises
const path = require("path")
const recast = require("recast")
const { namedTypes: n } = require("ast-types")

const APP_DIR = path.join(__dirname, "../app")

// Get the permalink array from a page.tsx file path
// Example: app/contact/page.tsx -> ["contact"]
// Example: app/the-president/former-presidents/page.tsx -> ["the-president", "former-presidents"]
// Example: app/page.tsx -> [] (empty array for root)
const getPermalinkFromPath = (filePath) => {
  const relativePath = path.relative(APP_DIR, filePath)

  // Handle root page.tsx
  if (relativePath === "page.tsx") {
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

// Process a single page.tsx file
const processPageFile = async (filePath) => {
  const permalink = getPermalinkFromPath(filePath)
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
    const updated = updateStaticRoutePermalink(ast, permalink)

    if (!updated) {
      return false
    }

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
    } else if (entry.name === "page.tsx") {
      files.push(fullPath)
    }
  }

  return files
}

const main = async () => {
  try {
    const allPageFiles = await findPageFiles(APP_DIR)

    // Filter out the catch-all route which should keep STATIC_ROUTE_PERMALINK as undefined
    const pageFiles = allPageFiles.filter((filePath) => {
      const relativePath = path.relative(APP_DIR, filePath)
      // Skip the catch-all route [[...permalink]]/page.tsx
      return !relativePath.startsWith("[[...permalink]]")
    })

    console.log("Updating STATIC_ROUTE_PERMALINK constants...\n")
    let updatedCount = 0

    for (const filePath of pageFiles) {
      const permalink = getPermalinkFromPath(filePath)
      const updated = await processPageFile(filePath)
      if (updated) {
        updatedCount++
        const routePath = "/" + permalink.join("/") || "/"
      }
    }

    if (updatedCount === 0) {
      console.log(
        "\nNote: No files were updated. Make sure your page.tsx files contain: const STATIC_ROUTE_PERMALINK: string[] | undefined = undefined",
      )
    }
  } catch (error) {
    console.error("Error:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
