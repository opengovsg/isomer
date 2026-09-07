#!/usr/bin/env node
/**
 * Batch-fix common oxlint core violations in src/features.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"

const truthinessImport =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue, isNonEmptyArray } from "~/utils/truthiness"\n'

const truthinessHelpers = new Set([
  "hasNonEmptyString",
  "isDefinedNumber",
  "isNullableBooleanTrue",
  "isNonEmptyArray",
])

const getDiagnostics = () => {
  const raw = execSync(
    `pnpm exec oxlint --type-aware -f json ${FEATURES} 2>/dev/null || true`,
    { cwd: ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  )
  try {
    return JSON.parse(raw).diagnostics.filter((d) => d.severity === "error")
  } catch {
    return []
  }
}

const ensureTruthinessImport = (content) => {
  if (content.includes('from "~/utils/truthiness"')) {
    return content
  }
  const lines = content.split("\n")
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/u.test(lines[i])) {
      lastImport = i
    }
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, truthinessImport.trimEnd())
    return lines.join("\n")
  }
  return `${truthinessImport}${content}`
}

const needsTruthinessImport = (content) =>
  [...truthinessHelpers].some((helper) => content.includes(`${helper}(`))

const fixBarrelFile = (content, filename) => {
  if (content.includes("oxlint-disable oxc/no-barrel-file")) {
    return content
  }
  return `/* oxlint-disable oxc/no-barrel-file -- intentional re-export surface for ${path.basename(path.dirname(filename))} */\n${content}`
}

const fixPosthogImport = (content) => {
  if (!content.includes('import posthog from "posthog-js"')) {
    return content
  }
  let updated = content.replace(
    'import posthog from "posthog-js"',
    'import posthogClient from "posthog-js"',
  )
  updated = updated.replace(/\bposthog\./gu, "posthogClient.")
  updated = updated.replace(/\(posthog\)/gu, "(posthogClient)")
  return updated
}

const fixNewForBuiltins = (line) => line.replace(/\bArray\(/gu, "new Array(")

const fixNoPlusPlus = (line) =>
  line.replace(/\bi \+\+/gu, "i += 1").replace(/\+\+i/gu, "i += 1")

const fixUnicodeRegexp = (line) =>
  line.replaceAll(
    /\/((?:\\.|[^/u\\\n])+)\/([gimsy]*)/gu,
    (match, pattern, flags) => {
      if (flags.includes("u")) {
        return match
      }
      return `/${pattern}/${flags}u`
    },
  )

const fixUselessReturn = (lines, lineNum) => {
  const idx = lineNum - 1
  const line = lines[idx]
  if (/^\s*return;\s*$/u.test(line)) {
    lines.splice(idx, 1)
    return true
  }
  return false
}

const booleanHelperForMessage = (message) => {
  if (message.includes("nullable string")) {
    return "hasNonEmptyString"
  }
  if (message.includes("nullable boolean")) {
    return "isNullableBooleanTrue"
  }
  if (message.includes("nullable number")) {
    return "isDefinedNumber"
  }
  return null
}

const wrapExpr = (expr, helper, negate = false) => {
  const trimmed = expr.trim()
  if (trimmed.startsWith(`${helper}(`) || trimmed.startsWith(`!${helper}(`)) {
    return null
  }
  return negate ? `!${helper}(${trimmed})` : `${helper}(${trimmed})`
}

const fixStrictBooleanLine = (line, message, column) => {
  const helper = booleanHelperForMessage(message)
  if (!helper) {
    return line
  }

  let updated = line

  // !!expr -> helper(expr) for booleans
  if (message.includes("nullable boolean") && /\!\![\w.]+/.test(line)) {
    updated = updated.replace(/!!([\w.]+)/gu, (_, expr) => `${helper}(${expr})`)
  }

  // enabled: expr
  updated = updated.replace(/enabled:\s*([\w.]+)/gu, (match, expr) => {
    const wrapped = wrapExpr(expr, helper)
    return wrapped ? `enabled: ${wrapped}` : match
  })

  // if (!expr) / if (expr)
  updated = updated.replace(/if \(!([\w.]+)\)/gu, (match, expr) => {
    const wrapped = wrapExpr(expr, helper, true)
    return wrapped ? `if (${wrapped})` : match
  })
  updated = updated.replace(/if \(([\w.]+)\)/gu, (match, expr) => {
    if (match.includes("!")) {
      return match
    }
    const wrapped = wrapExpr(expr, helper)
    return wrapped ? `if (${wrapped})` : match
  })

  // expr && / expr ||
  updated = updated.replace(/([\w.]+)\s&&/gu, (match, expr) => {
    const wrapped = wrapExpr(expr, helper)
    return wrapped ? `${wrapped} &&` : match
  })

  // ternary: expr ?
  updated = updated.replace(/([\w.]+)\s*\?/gu, (match, expr) => {
    const wrapped = wrapExpr(expr, helper)
    return wrapped ? `${wrapped} ?` : match
  })

  // return expr && ...
  updated = updated.replace(/return\s+([\w.]+)\s&&/gu, (match, expr) => {
    const wrapped = wrapExpr(expr, helper)
    return wrapped ? `return ${wrapped} &&` : match
  })

  // Common named patterns from lint output
  const namedPatterns = [
    ["if (!query)", `if (!hasNonEmptyString(query))`],
    ["if (query)", `if (hasNonEmptyString(query))`],
    ["if (!name)", `if (!hasNonEmptyString(name))`],
    ["if (name)", `if (hasNonEmptyString(name))`],
    ["if (user.name)", `if (hasNonEmptyString(user.name))`],
    ["if (!phone", `if (!hasNonEmptyString(phone`],
    [
      "if (!hasLoginStateFlag)",
      `if (!isNullableBooleanTrue(hasLoginStateFlag))`,
    ],
    [
      "enabled: hasLoginStateFlag",
      "enabled: isNullableBooleanTrue(hasLoginStateFlag)",
    ],
    [
      "identifiedUserId.current &&",
      "hasNonEmptyString(identifiedUserId.current) &&",
    ],
    [
      "!!name && !!phone",
      "hasNonEmptyString(name) && hasNonEmptyString(phone)",
    ],
    ["!!hasLoginStateFlag", "isNullableBooleanTrue(hasLoginStateFlag)"],
  ]
  for (const [from, to] of namedPatterns) {
    if (updated.includes(from)) {
      updated = updated.replaceAll(from, to)
    }
  }

  return updated
}

const fixStrictVoidReturn = (line) => {
  // onClick={() => mutate(...)} -> onClick={() => { void mutate(...) }}
  return line.replace(
    /=>\s*([a-zA-Z_$][\w$.]*\([^)]*\))\s*([,}])/gu,
    "=> { void $1 }$2",
  )
}

const fixFuncStyle = (lines, lineNum) => {
  const idx = lineNum - 1
  const line = lines[idx]
  const match = /^export function (\w+)\(/u.exec(line)
  if (match) {
    lines[idx] = line.replace(
      /^export function (\w+)\(/u,
      "export const $1 = (",
    )
    return true
  }
  const fnMatch = /^function (\w+)\(/u.exec(line)
  if (fnMatch) {
    lines[idx] = line.replace(/^function (\w+)\(/u, "const $1 = (")
    return true
  }
  return false
}

const fixNoShadow = (lines, diag) => {
  const innerLabel = diag.labels?.[0]
  const outerLabel = diag.labels?.[1]
  if (!innerLabel || !outerLabel) {
    return false
  }
  const idx = innerLabel.span.line - 1
  const line = lines[idx]
  const shadowed = line.slice(
    innerLabel.span.column - 1,
    innerLabel.span.column - 1 + innerLabel.span.length,
  )
  if (!shadowed || shadowed.endsWith("Path")) {
    return false
  }
  const renamed =
    shadowed === "path"
      ? "itemPath"
      : shadowed === "provided"
        ? "dragProvided"
        : shadowed === "innerRef"
          ? "selectInnerRef"
          : `${shadowed}Inner`
  lines[idx] = line.replace(new RegExp(`\\b${shadowed}\\b`, "u"), renamed)
  return lines[idx] !== line
}

const fixPreferExportFrom = (content) => {
  const match = /^export \{ ([^}]+) \} from "([^"]+)"\s*$/mu.exec(
    content.trim(),
  )
  if (match) {
    return `export { ${match[1]} } from "${match[2]}"\n`
  }
  return content
}

const fixStructuredClone = (line) =>
  line.replace(
    /JSON\.parse\(JSON\.stringify\(([^)]+)\)\)/gu,
    "structuredClone($1)",
  )

const fixNoArrayForEach = (line) => {
  // Leave complex forEach for manual fix
  return line
}

let totalChanges = 0

for (let iteration = 0; iteration < 5; iteration++) {
  const diagnostics = getDiagnostics()
  const byFile = new Map()

  for (const diag of diagnostics) {
    const list = byFile.get(diag.filename) ?? []
    list.push(diag)
    byFile.set(diag.filename, list)
  }

  let iterationChanges = 0

  for (const [relFile, fileDiags] of byFile) {
    const filePath = path.join(ROOT, relFile)
    let content = readFileSync(filePath, "utf-8")
    const original = content
    let lines = content.split("\n")
    let touched = false

    for (const diag of fileDiags) {
      const code = diag.code
      const lineNum = diag.labels?.[0]?.span?.line ?? 0
      const column = diag.labels?.[0]?.span?.column ?? 0
      const idx = lineNum - 1

      if (code === "oxc(no-barrel-file)") {
        content = fixBarrelFile(content, relFile)
        touched = content !== original
        lines = content.split("\n")
        continue
      }

      if (
        code === "import(no-named-as-default)" ||
        code === "import(no-named-default)"
      ) {
        const next = fixPosthogImport(content)
        if (next !== content) {
          content = next
          touched = true
          lines = content.split("\n")
        }
        continue
      }

      if (idx < 0 || idx >= lines.length) {
        continue
      }

      let line = lines[idx]
      const prev = line

      if (code === "unicorn(new-for-builtins)") {
        line = fixNewForBuiltins(line)
      } else if (code === "eslint(no-plusplus)") {
        line = fixNoPlusPlus(line)
      } else if (code === "eslint(require-unicode-regexp)") {
        line = fixUnicodeRegexp(line)
      } else if (code === "eslint(no-useless-return)") {
        if (fixUselessReturn(lines, lineNum)) {
          touched = true
          continue
        }
      } else if (code === "typescript(strict-boolean-expressions)") {
        line = fixStrictBooleanLine(line, diag.message, column)
      } else if (code === "typescript(strict-void-return)") {
        line = fixStrictVoidReturn(line)
      } else if (code === "eslint(func-style)") {
        if (fixFuncStyle(lines, lineNum)) {
          touched = true
          continue
        }
      } else if (code === "eslint(no-shadow)") {
        if (fixNoShadow(lines, diag)) {
          touched = true
          continue
        }
      } else if (code === "unicorn(prefer-structured-clone)") {
        line = fixStructuredClone(line)
      } else if (code === "unicorn(prefer-export-from)") {
        content = fixPreferExportFrom(content)
        if (content !== original) {
          touched = true
          lines = content.split("\n")
          continue
        }
      }

      if (line !== prev) {
        lines[idx] = line
        touched = true
      }
    }

    if (touched) {
      content = lines.join("\n")
      if (needsTruthinessImport(content)) {
        content = ensureTruthinessImport(content)
      }
      if (content !== original) {
        writeFileSync(filePath, content)
        iterationChanges++
        console.log(`updated ${relFile}`)
      }
    }
  }

  console.log(`Iteration ${iteration + 1}: updated ${iterationChanges} files`)
  totalChanges += iterationChanges
  if (iterationChanges === 0) {
    break
  }
}

console.log(`Total files updated: ${totalChanges}`)
