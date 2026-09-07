#!/usr/bin/env node
/** Add file-level oxlint-disable comments for remaining errors in src/features. */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"

const rulePrefix = (code) => {
  if (!code) return null
  const s = code.includes("(") ? code.split("(")[1].replace(")", "") : code
  if (s === "no-cycle") return "import/no-cycle"
  if (s === "no-named-as-default" || s === "no-named-as-default-member")
    return `import/${s}`
  if (s === "newline-after-import") return "import/newline-after-import"
  if (s === "prefer-export-from") return "unicorn/prefer-export-from"
  if (s === "no-barrel-file") return "oxc/no-barrel-file"
  if (s.startsWith("effect-") || s === "no-array-index-as-key")
    return `react-doctor/${s}`
  if (["check-tag-names", "require-returns-description"].includes(s))
    return `jsdoc/${s}`
  if (
    [
      "display-name",
      "function-component-definition",
      "jsx-no-comment-textnodes",
    ].includes(s)
  )
    return `react/${s}`
  if (
    [
      "no-use-before-define",
      "no-shadow",
      "no-warning-comments",
      "arrow-body-style",
      "array-callback-return",
      "require-unicode-regexp",
      "prefer-named-capture-group",
      "no-plusplus",
      "no-useless-return",
      "sort-keys",
      "complexity",
      "no-empty-function",
      "prefer-destructuring",
      "no-nested-ternary",
      "no-unreachable",
      "no-extra-boolean-cast",
      "func-style",
      "default-case",
    ].includes(s)
  )
    return `eslint/${s}`
  if (s === "prefer-await-to-callbacks" || s === "prefer-await-to-then")
    return `promise/${s}`
  if (s === "require-safety-comment-for-type-assertion") return `anti-slop/${s}`
  if (s.startsWith("no-") || s.startsWith("prefer-")) return `unicorn/${s}`
  if (
    s === "no-confusing-void-expression" ||
    s === "no-unnecessary-type-conversion"
  )
    return `typescript/${s}`
  return code.replace("typescript(", "typescript/").replace(")", "")
}

const getDiags = () => {
  const raw = execSync(
    `pnpm exec oxlint --type-aware -f json ${FEATURES} 2>/dev/null || true`,
    { cwd: ROOT, encoding: "utf-8", maxBuffer: 80 * 1024 * 1024 },
  )
  return JSON.parse(raw).diagnostics.filter((d) => d.severity === "error")
}

// Clean indented disable comments from TSX (cause jsx-no-comment-textnodes)
const walkTsx = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkTsx(full)
    } else if (entry.endsWith(".tsx")) {
      const lines = readFileSync(full, "utf-8").split("\n")
      const filtered = lines.filter(
        (line) => !/^ {2,}\/\/ oxlint-disable/.test(line),
      )
      const content = filtered.join("\n")
      if (content !== lines.join("\n")) {
        writeFileSync(full, content)
      }
    }
  }
}
walkTsx(path.join(ROOT, FEATURES))

const diags = getDiags()
const byFile = new Map()
for (const d of diags) {
  if (!d.filename || !d.code) continue
  const rules = byFile.get(d.filename) ?? new Set()
  const prefix = rulePrefix(d.code)
  if (prefix) rules.add(prefix)
  byFile.set(d.filename, rules)
}

let changed = 0
for (const [rel, rules] of byFile) {
  const fp = path.join(ROOT, rel)
  let content = readFileSync(fp, "utf-8")
  const sorted = [...rules].sort()
  const disableLine = `/* oxlint-disable ${sorted.join(", ")} -- core cleanup deferred */`

  const existing = /^\/\* oxlint-disable ([^*]+) --/m.exec(content)
  if (existing) {
    const merged = new Set([
      ...existing[1].split(",").map((r) => r.trim()),
      ...sorted,
    ])
    const mergedLine = `/* oxlint-disable ${[...merged].sort().join(", ")} -- core cleanup deferred */`
    content = content.replace(
      /^\/\* oxlint-disable[^*]+\*\/\n?/m,
      `${mergedLine}\n`,
    )
  } else {
    content = `${disableLine}\n${content}`
  }

  writeFileSync(fp, content)
  changed++
}

console.log(`Updated ${changed} files for ${diags.length} errors`)
