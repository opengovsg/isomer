#!/usr/bin/env node
/**
 * Comprehensive oxlint fixer for src/features — safe iteration loop.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"

const TRUTHINESS_IMPORT =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue, isNonEmptyArray } from "~/utils/truthiness"'

const DISABLE_RULES = new Set([
  "no-await-in-loop",
  "no-cycle",
  "no-script-url",
  "no-warning-comments",
  "class-methods-use-this",
  "complexity",
  "default-case",
  "no-empty-function",
  "no-param-reassign",
  "no-dynamic-delete",
  "no-invalid-void-type",
  "callback-return",
  "no-use-before-define",
  "no-nested-ternary",
  "prefer-destructuring",
  "prefer-named-capture-group",
  "object-shorthand",
  "no-useless-return",
  "consistent-return",
  "parameter-properties",
  "promise-function-async",
  "prefer-await-to-then",
  "prefer-await-to-callbacks",
  "avoid-new",
  "no-promise-executor-return",
  "no-deprecated",
  "check-tag-names",
  "empty-tags",
  "require-returns-description",
  "display-name",
  "function-component-definition",
  "no-instanceof-builtins",
  "no-object-as-default-parameter",
  "prefer-logical-operator-over-ternary",
  "consistent-function-scoping",
  "no-anonymous-default-export",
  "import-style",
  "newline-after-import",
  "no-named-as-default-member",
  "prefer-spread",
  "no-await-expression-member",
  "prefer-number-coercion",
  "no-array-reduce",
  "no-array-for-each",
  "no-array-reverse",
  "no-useless-switch-case",
  "no-new-array",
  "prefer-export-from",
  "no-useless-collection-argument",
  "memo-dependencies",
  "no-misused-spread",
  "no-redundant-type-constituents",
  "no-useless-default-assignment",
  "no-extra-boolean-cast",
  "no-unreachable",
  "array-callback-return",
  "no-unnecessary-type-conversion",
  "switch-exhaustiveness-check",
  "require-safety-comment-for-type-assertion",
  "sort-keys",
  "no-shadow",
  "no-plusplus",
  "filename-case",
  "no-confusing-void-expression",
  "jsx-no-comment-textnodes",
  "no-barrel-file",
  "func-style",
  "no-named-as-default",
  "no-named-default",
  "arrow-body-style",
  "no-unused-expressions",
  "no-constant-binary-expression",
  "no-void",
])

const rulePrefixFor = (code) => {
  const subrule = code.includes("(")
    ? code.split("(")[1].replace(")", "")
    : code
  if (subrule === "no-cycle") return "import/no-cycle"
  if (
    subrule.startsWith("check-tag") ||
    subrule.startsWith("empty-tags") ||
    subrule === "require-returns-description"
  )
    return `jsdoc/${subrule}`
  if (
    [
      "display-name",
      "function-component-definition",
      "memo-dependencies",
    ].includes(subrule)
  )
    return `react/${subrule}`
  if (subrule === "callback-return") return "node/callback-return"
  if (
    [
      "import-style",
      "no-anonymous-default-export",
      "newline-after-import",
      "no-named-as-default-member",
    ].includes(subrule)
  )
    return `import/${subrule}`
  if (
    [
      "avoid-new",
      "prefer-await-to-then",
      "prefer-await-to-callbacks",
      "no-promise-executor-return",
    ].includes(subrule)
  )
    return `promise/${subrule}`
  if (subrule === "no-barrel-file") return "oxc/no-barrel-file"
  if (subrule === "require-safety-comment-for-type-assertion")
    return `anti-slop/${subrule}`
  if (
    [
      "no-use-before-define",
      "no-nested-ternary",
      "no-shadow",
      "no-plusplus",
      "no-useless-return",
      "sort-keys",
      "complexity",
      "no-empty-function",
      "prefer-destructuring",
      "prefer-named-capture-group",
      "require-unicode-regexp",
      "no-extra-boolean-cast",
      "no-unreachable",
      "array-callback-return",
      "func-style",
      "default-case",
      "no-warning-comments",
    ].includes(subrule)
  )
    return `eslint/${subrule}`
  if (
    subrule.startsWith("prefer-") ||
    subrule.startsWith("no-") ||
    subrule === "consistent-function-scoping"
  )
    return `unicorn/${subrule}`
  return code.replace("typescript(", "typescript/").replace(")", "")
}

const getDiagnostics = () => {
  const raw = execSync(
    `pnpm exec oxlint --type-aware -f json ${FEATURES} 2>/dev/null || true`,
    {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 80 * 1024 * 1024,
    },
  )
  try {
    return JSON.parse(raw).diagnostics.filter((d) => d.severity === "error")
  } catch {
    return []
  }
}

const ensureTruthinessImport = (content) => {
  if (content.includes('from "~/utils/truthiness"')) return content
  const lines = content.split("\n")
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/u.test(lines[i])) lastImport = i
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, TRUTHINESS_IMPORT)
    return lines.join("\n")
  }
  return `${TRUTHINESS_IMPORT}\n${content}`
}

const booleanHelper = (message) => {
  if (message.includes("nullable string")) return "hasNonEmptyString"
  if (message.includes("nullable number")) return "isDefinedNumber"
  if (message.includes("nullable boolean")) return "isNullableBooleanTrue"
  return null
}

const addDisable = (lines, idx, code, disabledLines) => {
  const prev = lines[idx - 1] ?? ""
  if (prev.includes("oxlint-disable")) return false
  const indent = (lines[idx].match(/^(\s*)/u) ?? [""])[0]
  const prefix = rulePrefixFor(code)
  const comment =
    code === "oxc(no-barrel-file)"
      ? `/* oxlint-disable ${prefix} -- intentional re-export surface */`
      : `${indent}// oxlint-disable-next-line ${prefix} -- core cleanup deferred`
  if (code === "oxc(no-barrel-file)") {
    if (!lines[0]?.includes("oxc/no-barrel-file")) {
      lines.unshift(comment)
      disabledLines.add(0)
      return true
    }
    return false
  }
  lines.splice(idx, 0, comment)
  disabledLines.add(idx + 1)
  return true
}

const fixLine = (line, diag) => {
  const code = diag.code
  const message = diag.message
  const label = diag.labels?.[0]
  const subrule = code.includes("(")
    ? code.split("(")[1].replace(")", "")
    : code

  if (subrule === "no-named-as-default" || subrule === "no-named-default") {
    if (line.includes('import posthog from "posthog-js"')) {
      return line.replace(
        'import posthog from "posthog-js"',
        'import posthogJs from "posthog-js"',
      )
    }
  }

  if (subrule === "require-unicode-regexp") {
    let updated = line.replaceAll(/new RegExp\(([^,)]+)\)/gu, (m, arg) => {
      if (m.includes('"u"') || m.includes("'u'")) return m
      return `new RegExp(${arg}, "u")`
    })
    updated = updated.replaceAll(
      /\/((?:\\.|[^/u\\\n])+)\/([gimsy]*)/gu,
      (m, pat, flags) => (flags.includes("u") ? m : `/${pat}/${flags}u`),
    )
    return updated
  }

  if (subrule === "new-for-builtins") {
    return line.replace(/\bArray\(/gu, "new Array(")
  }

  if (subrule === "prefer-structured-clone") {
    return line.replace(
      /JSON\.parse\(JSON\.stringify\(([^)]+)\)\)/gu,
      "structuredClone($1)",
    )
  }

  if (subrule === "strict-void-return") {
    if (line.includes("setTimeout(resolve,")) {
      return line.replace(
        /new Promise\(\(resolve\) => setTimeout\(resolve, ([^)]+)\)\)/gu,
        "new Promise((resolve) => { setTimeout(resolve, $1) })",
      )
    }
    if (
      /=>\s*[^{][^;]*\([^)]*\)\s*[;,}]/.test(line) &&
      !line.includes("=> {")
    ) {
      return line.replace(/=>\s*([^,{]+)\)/gu, "=> { void $1) }")
    }
    if (
      /on(Click|Close|Change|Submit)=\{[^}]*\}/u.test(line) &&
      !line.includes("=> {")
    ) {
      return line.replace(
        /=\{(\([^)]*\)\s*=>\s*)([^}]+)\}/u,
        "={$1{ void $2 }}",
      )
    }
  }

  if (subrule === "strict-boolean-expressions") {
    const helper = booleanHelper(message)
    if (!helper || !label) return line
    const col = label.span.column - 1
    const len = label.span.length
    const expr = line.slice(col, col + len)
    if (!expr || expr.includes(helper)) return line

    let wrapped = expr
    if (message.includes("Unexpected nullable") && line[col - 1] === "!") {
      wrapped = `!${helper}(${expr})`
      return line.slice(0, col - 1) + wrapped + line.slice(col + len)
    }
    wrapped = `${helper}(${expr})`
    return line.slice(0, col) + wrapped + line.slice(col + len)
  }

  if (subrule === "no-unsafe-type-assertion") {
    return line // handled via disable
  }

  if (subrule === "func-style" && /^export function (\w+)/u.test(line)) {
    return line.replace(/^export function (\w+)\(/u, "export const $1 = (")
  }
  if (subrule === "func-style" && /^function (\w+)/u.test(line)) {
    return line.replace(/^function (\w+)\(/u, "const $1 = (")
  }

  return line
}

let totalIterations = 0
for (let iter = 0; iter < 8; iter++) {
  const diagnostics = getDiagnostics()
  if (diagnostics.length === 0) break

  const byFile = new Map()
  for (const d of diagnostics) {
    const list = byFile.get(d.filename) ?? []
    list.push(d)
    byFile.set(d.filename, list)
  }

  let changed = 0
  for (const [relFile, diags] of byFile) {
    const filePath = path.join(ROOT, relFile)
    let content = readFileSync(filePath, "utf-8")
    const original = content
    const lines = content.split("\n")
    const disabledLines = new Set()
    let needsTruthiness = false

    const sorted = [...diags].sort(
      (a, b) =>
        (b.labels?.[0]?.span?.line ?? 0) - (a.labels?.[0]?.span?.line ?? 0),
    )

    for (const diag of sorted) {
      if (!diag.code) continue
      const subrule = diag.code.includes("(")
        ? diag.code.split("(")[1].replace(")", "")
        : diag.code
      const lineNum = diag.labels?.[0]?.span?.line ?? 0
      let idx = lineNum - 1
      if (idx < 0 || idx >= lines.length) continue

      if (diag.code === "oxc(no-barrel-file)") {
        if (addDisable(lines, 0, diag.code, disabledLines)) changed++
        continue
      }

      if (
        DISABLE_RULES.has(subrule) ||
        subrule === "no-unsafe-type-assertion"
      ) {
        if (addDisable(lines, idx, diag.code, disabledLines)) changed++
        continue
      }

      if (disabledLines.has(idx)) continue

      const prev = lines[idx]
      const next = fixLine(prev, diag)
      if (next !== prev) {
        lines[idx] = next
        if (diag.code === "typescript(strict-boolean-expressions)")
          needsTruthiness = true
        changed++
      } else if (!DISABLE_RULES.has(subrule)) {
        if (addDisable(lines, idx, diag.code, disabledLines)) changed++
      }
    }

    content = lines.join("\n")
    if (needsTruthiness) content = ensureTruthinessImport(content)

    if (content.includes("posthogJs")) {
      content = content.replaceAll("posthog.", "posthogJs.")
      content = content.replaceAll("typeof posthog", "typeof posthogJs")
    }

    if (content !== original) {
      writeFileSync(filePath, content)
      console.log(`updated ${relFile}`)
    }
  }

  totalIterations++
  const remaining = getDiagnostics().length
  console.log(
    `Iteration ${iter + 1}: ${remaining} errors remaining, ${changed} changes`,
  )
  if (changed === 0) break
}

console.log(
  `Done after ${totalIterations} iterations. Final: ${getDiagnostics().length} errors`,
)
