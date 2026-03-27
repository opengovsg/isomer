import fs from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { namedTypes as n } from "ast-types"

import type { SiteSitemapAnalysis } from "./utils/analysis"
import { collectSiteUsedItems } from "./utils/analysis"
import {
  filterCasesByUsed,
  isComponentTypeSwitch,
  isPropsLayoutSwitch,
  LAYOUT_SKIP_VALUES,
} from "./utils/ast"
import { COMPONENT_IMPORTS, LAYOUT_IMPORTS } from "./utils/constants"

const require = createRequire(import.meta.url)

/** Use require() so recast works when the script runs in another project (ESM import can expose recast without .parse/.visit/.print there). */
function getRecast(): ReturnType<typeof require> {
  return require("recast")
}

const recast = getRecast()

function getBaseDir(): string {
  return process.env.TEMPLATE_BASE_DIR ?? path.join(__dirname, "..")
}

const CATCH_ALL_SEGMENT = "[[...permalink]]"

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

/** Parse via recast so it keeps the source for comment/whitespace when printing (JS did this; TS migration had switched to babel.parse directly which broke comments). Use require() so we get the CJS build when the script runs in another project (ESM import can expose recast without .parse there). */
const parseWithRecast = (content: string) => {
  const babelParser = require("@babel/parser") as
    | typeof import("@babel/parser")
    | undefined
  if (!babelParser?.parse) {
    throw new Error(
      "@babel/parser not found. Install it in this project (e.g. npm install @babel/parser).",
    )
  }
  if (typeof recast?.parse !== "function") {
    throw new Error(
      "recast.parse is not available. Ensure recast is installed (e.g. npm install recast).",
    )
  }
  return recast.parse(content, {
    parser: {
      parse(source: string) {
        return babelParser.parse(source, {
          ...PARSER_OPTIONS,
          plugins: [...PARSER_OPTIONS.plugins],
        })
      },
    },
  })
}

const PRINT_OPTIONS = {
  quote: "double" as const,
  tabWidth: 2,
  trailingComma: true,
  wrapColumn: 80,
  reuseWhitespace: true,
}

function getImportSpecifierImportedName(spec: unknown): string | null {
  if (!n.ImportSpecifier.check(spec)) return null
  const imp = spec.imported
  if (n.Identifier.check(imp)) return imp.name
  return null
}

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
        const name = getImportSpecifierImportedName(spec)
        if (name === null) return true
        const keep = shouldKeepImportSpecifier(
          name,
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

const processCatchAllPage = async (
  filePath: string,
  siteAnalysis: SiteSitemapAnalysis,
) => {
  const { usedLayouts, usedComponents } = collectSiteUsedItems(siteAnalysis)

  const content = await fs.readFile(filePath, "utf8")

  if (
    !content.includes("renderNextLayout") ||
    !content.includes("renderComponent")
  ) {
    console.warn(
      `Skipping ${filePath}: expected renderNextLayout and renderComponent.`,
    )
    return false
  }

  try {
    const ast = parseWithRecast(content)

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

export async function run(baseDir?: string): Promise<void> {
  const base = baseDir ?? getBaseDir()
  const sitemapAnalysisPath = path.join(base, "sitemap-analysis.json")
  const catchAllPage = path.join(base, "app", CATCH_ALL_SEGMENT, "page.tsx")

  console.log("Reading sitemap-analysis.json...")
  const sitemapAnalysisContent = await fs.readFile(sitemapAnalysisPath, "utf8")
  const siteAnalysis = JSON.parse(sitemapAnalysisContent) as SiteSitemapAnalysis

  console.log(`Pruning imports and switch cases in ${catchAllPage}...\n`)

  try {
    await fs.access(catchAllPage)
  } catch {
    throw new Error(
      `Catch-all page not found: ${catchAllPage}. Expected app/${CATCH_ALL_SEGMENT}/page.tsx`,
    )
  }

  const updated = await processCatchAllPage(catchAllPage, siteAnalysis)

  if (!updated) {
    console.log(
      "\nNote: No changes were written (already minimal or unchanged).",
    )
  } else {
    console.log(`\n✓ Updated ${path.relative(base, catchAllPage)}`)
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
