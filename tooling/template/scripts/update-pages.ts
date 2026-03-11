import fs from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { namedTypes as n } from "ast-types"
import * as recast from "recast"

import type { SitemapAnalysis } from "./utils/analysis"
import { collectUsedItems } from "./utils/analysis"
import {
  filterCasesByUsed,
  isComponentTypeSwitch,
  isPropsLayoutSwitch,
  LAYOUT_SKIP_VALUES,
} from "./utils/ast"
import { COMPONENT_IMPORTS, LAYOUT_IMPORTS } from "./utils/constants"
import {
  getPermalinkFromPath,
  getRouteFromPath,
  PAGE_FILE_NAME,
} from "./utils/paths"

const require = createRequire(import.meta.url)

function getBaseDir(): string {
  return process.env.TEMPLATE_BASE_DIR ?? path.join(__dirname, "..")
}

const PARSER_OPTIONS = {
  sourceType: "module" as const,
  plugins: [
    "typescript",
    "jsx",
    "decorators-legacy",
    "classProperties",
    "objectRestSpread",
  ] as const,
  tokens: true,
}

const PRINT_OPTIONS = {
  quote: "double" as const,
  tabWidth: 2,
  trailingComma: true,
  wrapColumn: 80,
  reuseWhitespace: false,
}

// ---------------------------------------------------------------------------
// Helpers: when to keep an import / which switch cases to keep
// ---------------------------------------------------------------------------

function shouldKeepImportSpecifier(
  importName: string,
  isLayoutImport: boolean,
  isComponentImport: boolean,
  usedLayouts: Set<string>,
  usedComponents: Set<string>,
): boolean {
  if (isLayoutImport) {
    for (const [layoutType, layoutImportName] of Object.entries(LAYOUT_IMPORTS))
      if (importName === layoutImportName && usedLayouts.has(layoutType))
        return true
    return false
  }
  if (isComponentImport) {
    for (const [componentType, componentImportName] of Object.entries(
      COMPONENT_IMPORTS,
    ))
      if (
        importName === componentImportName &&
        usedComponents.has(componentType)
      )
        return true
    return false
  }
  return false
}

function isTargetFunctionName(name: string | undefined): boolean {
  return name === "renderNextLayout" || name === "renderComponent"
}

function getFunctionBody(node: { body?: unknown; init?: unknown }): unknown {
  if (n.BlockStatement.check(node.body)) return node.body
  const init = node.init
  if (
    n.ArrowFunctionExpression.check(init) &&
    n.BlockStatement.check(init.body)
  )
    return init.body
  if (n.FunctionExpression.check(init) && n.BlockStatement.check(init.body))
    return init.body
  return null
}

// ---------------------------------------------------------------------------
// AST transforms: update STATIC_ROUTE_PERMALINK, prune imports, prune switch cases
// ---------------------------------------------------------------------------

function updateStaticRoutePermalink(
  ast: unknown,
  permalink: string[],
): boolean {
  const b = recast.types.builders
  let found = false

  recast.visit(ast as any, {
    visitVariableDeclarator(p: any) {
      const node = p.node
      if (
        n.Identifier.check(node.id) &&
        node.id.name === "STATIC_ROUTE_PERMALINK"
      ) {
        found = true
        node.init = b.arrayExpression(permalink.map((seg) => b.literal(seg)))
        return false
      }
      this.traverse(p)
      return undefined
    },
  })

  return found
}

function removeUnusedImports(
  ast: unknown,
  usedLayouts: Set<string>,
  usedComponents: Set<string>,
): void {
  recast.visit(ast as any, {
    visitImportDeclaration(p: any) {
      const node = p.node
      const source: string = node.source?.value ?? ""
      const isLayoutImport = source.includes("/layouts/")
      const isComponentImport = source.includes("/components/")

      if (!isLayoutImport && !isComponentImport) {
        this.traverse(p)
        return undefined
      }

      const kept = (node.specifiers ?? []).filter((spec: any) => {
        if (!n.ImportSpecifier.check(spec)) return true
        const keep = shouldKeepImportSpecifier(
          spec.imported.name,
          isLayoutImport,
          isComponentImport,
          usedLayouts,
          usedComponents,
        )
        return keep
      })

      if (kept.length === 0) p.prune()
      else node.specifiers = kept
      this.traverse(p)
      return undefined
    },
  })
}

function processSwitchInFunction(
  funcBody: unknown,
  funcName: string,
  usedLayouts: Set<string>,
  usedComponents: Set<string>,
): void {
  recast.visit(funcBody as any, {
    visitSwitchStatement(switchPath: any) {
      const { node: switchNode } = switchPath
      const discriminant = switchNode.discriminant

      if (
        funcName === "renderNextLayout" &&
        isPropsLayoutSwitch(discriminant)
      ) {
        const kept = filterCasesByUsed(
          switchNode.cases,
          usedLayouts,
          LAYOUT_SKIP_VALUES,
        )
        if (kept.length < switchNode.cases.length) switchNode.cases = kept
      }

      if (
        funcName === "renderComponent" &&
        isComponentTypeSwitch(discriminant)
      ) {
        const kept = filterCasesByUsed(switchNode.cases, usedComponents)
        if (kept.length < switchNode.cases.length) switchNode.cases = kept
      }

      this.traverse(switchPath)
      return undefined
    },
  })
}

function removeUnusedSwitchCases(
  ast: unknown,
  usedLayouts: Set<string>,
  usedComponents: Set<string>,
): void {
  recast.visit(ast as any, {
    visitFunctionDeclaration(p: any) {
      if (isTargetFunctionName(p.node.id?.name)) {
        const body = getFunctionBody(p.node)
        if (body)
          processSwitchInFunction(
            body,
            p.node.id.name,
            usedLayouts,
            usedComponents,
          )
      }
      this.traverse(p)
      return undefined
    },
    visitVariableDeclarator(p: any) {
      if (isTargetFunctionName(p.node.id?.name)) {
        const body = getFunctionBody(p.node)
        if (body)
          processSwitchInFunction(
            body,
            p.node.id.name,
            usedLayouts,
            usedComponents,
          )
      }
      this.traverse(p)
      return undefined
    },
  })
}

const processPageFile = async (
  filePath: string,
  sitemapAnalysis: SitemapAnalysis,
  appDir: string,
) => {
  const permalink = getPermalinkFromPath(filePath, appDir, PAGE_FILE_NAME)
  const routePath = getRouteFromPath(filePath, appDir, PAGE_FILE_NAME)

  const { usedLayouts, usedComponents } = collectUsedItems(
    sitemapAnalysis,
    routePath,
  )

  const content = await fs.readFile(filePath, "utf8")

  if (!content.includes("STATIC_ROUTE_PERMALINK")) {
    return false
  }

  try {
    const babelParser = require("@babel/parser") as typeof import("@babel/parser")
    const ast = babelParser.parse(content, {
      ...PARSER_OPTIONS,
      plugins: [...PARSER_OPTIONS.plugins],
    })

    updateStaticRoutePermalink(ast, permalink)
    removeUnusedImports(ast, usedLayouts, usedComponents)
    removeUnusedSwitchCases(ast, usedLayouts, usedComponents)

    let newContent: string
    try {
      newContent = recast.print(ast, PRINT_OPTIONS).code
    } catch (printError) {
      const err = printError as Error
      console.error(`Error printing AST for ${filePath}:`, err.message)
      console.error(`  This might indicate an AST structure issue.`)
      try {
        newContent = recast.print(ast).code
      } catch (fallbackError) {
        const fallbackErr = fallbackError as Error
        throw new Error(
          `Failed to print AST: ${err.message}. Fallback also failed: ${fallbackErr.message}`,
        )
      }
    }

    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, "utf8")
      return true
    }

    return false
  } catch (error) {
    const err = error as Error
    console.error(`Error processing ${filePath}:`, err.message)
    console.error(`  Full error:`, err.stack)
    if (err.message.includes("regular expression")) {
      console.error(
        `  This might be a JSX parsing issue. Line number in error may not match actual line.`,
      )
    }
    return false
  }
}

const findPageFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = []
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

export async function run(baseDir?: string): Promise<void> {
  const base = baseDir ?? getBaseDir()
  const sitemapAnalysisPath = path.join(base, "sitemap-analysis.json")
  const appDir = path.join(base, "app")

  console.log("Reading sitemap-analysis.json...")
  const sitemapAnalysisContent = await fs.readFile(sitemapAnalysisPath, "utf8")
  const sitemapAnalysis = JSON.parse(sitemapAnalysisContent) as SitemapAnalysis

  console.log(`Finding all ${PAGE_FILE_NAME} files...`)
  const pageFiles = await findPageFiles(appDir)
  let updatedCount = 0

  console.log("Updating permalinks, imports and switch cases...\n")
  for (const filePath of pageFiles) {
    const routePath = getRouteFromPath(filePath, appDir, PAGE_FILE_NAME)
    const updated = await processPageFile(filePath, sitemapAnalysis, appDir)
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
}

const main = async () => {
  try {
    await run()
  } catch (error) {
    const err = error as Error
    console.error("Error:", err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntry) main()
