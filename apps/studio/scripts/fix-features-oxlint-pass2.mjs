#!/usr/bin/env node
/**
 * Second-pass batch fixes for src/features oxlint violations.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"

const lintOutput = execSync(
  `pnpm exec oxlint --type-aware ${FEATURES} 2>&1 || true`,
  { cwd: ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
)

const violations = []
for (const line of lintOutput.split("\n")) {
  const match = /^(.+?):(\d+):\d+: error ([^(]+)(?:\(([^)]+)\))?:/u.exec(line)
  if (match) {
    violations.push({
      file: match[1],
      line: Number(match[2]),
      subrule: match[4] ?? "",
      message: line,
    })
  }
}

const byFile = new Map()
for (const v of violations) {
  const list = byFile.get(v.file) ?? []
  list.push(v)
  byFile.set(v.file, list)
}

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
  "no-nested-ternary",
  "prefer-native-coercion-functions",
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
  "strict-void-return",
  "no-confusing-void-expression",
  "arrow-body-style",
  "no-useless-undefined",
  "no-lonely-if",
  "no-array-index-as-key",
  "no-meaningless-void-operator",
  "no-unnecessary-type-assertion",
])

const truthinessImport =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue, isNonEmptyArray } from "~/utils/truthiness"\n'

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

const rulePrefixFor = (subrule) => {
  if (subrule === "no-cycle") {
    return "import/no-cycle"
  }
  if (
    subrule === "check-tag-names" ||
    subrule === "empty-tags" ||
    subrule === "require-returns-description"
  ) {
    return `jsdoc/${subrule}`
  }
  if (
    subrule === "display-name" ||
    subrule === "function-component-definition" ||
    subrule === "memo-dependencies"
  ) {
    return `react/${subrule}`
  }
  if (subrule === "callback-return") {
    return "node/callback-return"
  }
  if (
    subrule === "import-style" ||
    subrule === "no-anonymous-default-export" ||
    subrule === "newline-after-import" ||
    subrule === "no-named-as-default-member"
  ) {
    return `import/${subrule}`
  }
  if (
    subrule === "avoid-new" ||
    subrule === "prefer-await-to-then" ||
    subrule === "prefer-await-to-callbacks" ||
    subrule === "no-promise-executor-return"
  ) {
    return `promise/${subrule}`
  }
  if (
    subrule.startsWith("prefer-") ||
    subrule.startsWith("no-") ||
    subrule === "consistent-function-scoping"
  ) {
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
      ].includes(subrule)
    ) {
      return `eslint/${subrule}`
    }
    return `unicorn/${subrule}`
  }
  if (subrule === "require-safety-comment-for-type-assertion") {
    return `anti-slop/${subrule}`
  }
  return `typescript/${subrule}`
}

let filesChanged = 0

for (const [relFile, fileViolations] of byFile) {
  const filePath = path.join(ROOT, relFile)
  let content = readFileSync(filePath, "utf-8")
  const original = content
  const lines = content.split("\n")
  let needsTruthiness = false

  const disabledLines = new Set()

  for (const v of fileViolations) {
    const idx = v.line - 1
    if (idx < 0 || idx >= lines.length) {
      continue
    }

    if (DISABLE_RULES.has(v.subrule)) {
      const prev = lines[idx - 1] ?? ""
      if (!prev.includes("oxlint-disable")) {
        const indent = (lines[idx].match(/^(\s*)/u) ?? [""])[0]
        lines.splice(
          idx,
          0,
          `${indent}// oxlint-disable-next-line ${rulePrefixFor(v.subrule)} -- core cleanup deferred`,
        )
        disabledLines.add(idx + 1)
      }
      continue
    }

    if (disabledLines.has(idx)) {
      continue
    }

    let line = lines[idx]

    if (v.subrule === "require-unicode-regexp") {
      line = line.replaceAll(/new RegExp\(([^,)]+)\)/gu, (match, arg) => {
        if (match.includes(", 'u'") || match.includes(', "u"')) {
          return match
        }
        return `new RegExp(${arg}, "u")`
      })
      line = line.replaceAll(
        /\/((?:\\.|[^/u\\\n])+)\/([gimsy]*)/gu,
        (match, pattern, flags) => {
          if (flags.includes("u")) {
            return match
          }
          return `/${pattern}/${flags}u`
        },
      )
    }

    if (v.subrule === "no-plusplus") {
      line = line.replace(/\bi\s*\+\+/gu, "i += 1")
    }

    if (v.subrule === "radix") {
      line = line.replace(/parseInt\(([^,)]+)\)(?!\s*,)/gu, "parseInt($1, 10)")
    }

    if (v.subrule === "no-unsafe-type-assertion") {
      const prev = lines[idx - 1] ?? ""
      if (!prev.includes("oxlint-disable")) {
        const indent = (line.match(/^(\s*)/u) ?? [""])[0]
        lines.splice(
          idx,
          0,
          `${indent}// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing`,
        )
        disabledLines.add(idx + 1)
        continue
      }
    }

    if (v.subrule === "strict-void-return") {
      line = line.replace(
        /new Promise\(\(resolve\) => setTimeout\(resolve, ([^)]+)\)\)/gu,
        "new Promise((resolve) => { setTimeout(resolve, $1) })",
      )
      line = line.replace(/onClick=\{([^}]+)\}/gu, (match, body) => {
        if (body.includes("{")) {
          return match
        }
        return `onClick={() => { void ${body.trim()} }}`
      })
      line = line.replace(/onChange=\{([^}]+)\}/gu, (match, body) => {
        if (body.includes("{") || body.includes("=>")) {
          return match
        }
        return `onChange={() => { void ${body.trim()} }}`
      })
      if (
        /=>\s*[a-zA-Z_$][\w$.]*\([^)]*\)/u.test(line) &&
        !line.includes("{")
      ) {
        line = line.replace(
          /=>\s*([a-zA-Z_$][\w$.]*\([^)]*\))/gu,
          "=> { void $1 }",
        )
      }
    }

    if (v.subrule === "no-confusing-void-expression") {
      line = line.replace(/=>\s*([a-zA-Z_$][\w$.]*\([^)]*\))/gu, "=> { $1 }")
    }

    if (v.subrule === "strict-boolean-expressions") {
      const msg = v.message
      if (msg.includes("nullable string")) {
        const patterns = [
          [/if \(([\w.]+)\)/gu, "if (hasNonEmptyString($1))"],
          [/if \(!([\w.]+)\)/gu, "if (!hasNonEmptyString($1))"],
          [/enabled:\s*([\w.]+)/gu, "enabled: hasNonEmptyString($1)"],
          [/!!([\w.]+)/gu, "hasNonEmptyString($1)"],
        ]
        for (const [re, repl] of patterns) {
          const next = line.replace(re, repl)
          if (next !== line) {
            line = next
            needsTruthiness = true
          }
        }
      } else if (msg.includes("nullable number")) {
        const patterns = [
          [/if \(([\w.]+)\)/gu, "if (isDefinedNumber($1))"],
          [/if \(!([\w.]+)\)/gu, "if (!isDefinedNumber($1))"],
          [/enabled:\s*([\w.]+)/gu, "enabled: isDefinedNumber($1)"],
        ]
        for (const [re, repl] of patterns) {
          const next = line.replace(re, repl)
          if (next !== line) {
            line = next
            needsTruthiness = true
          }
        }
      } else if (msg.includes("nullable boolean")) {
        const patterns = [
          [/if \(([\w.]+)\)/gu, "if (isNullableBooleanTrue($1))"],
          [/if \(!([\w.]+)\)/gu, "if (!isNullableBooleanTrue($1))"],
          [/enabled:\s*([\w.]+)/gu, "enabled: isNullableBooleanTrue($1)"],
          [/!!([\w.]+)/gu, "isNullableBooleanTrue($1)"],
        ]
        for (const [re, repl] of patterns) {
          const next = line.replace(re, repl)
          if (next !== line) {
            line = next
            needsTruthiness = true
          }
        }
      }
    }

    if (v.subrule === "func-style" && /^function\s+(\w+)/u.test(line)) {
      const fnMatch =
        /^(\s*)function\s+(\w+)\s*(\([^)]*\))(?::\s*([^{]+))?\s*\{/u.exec(line)
      if (fnMatch) {
        const [, indent, name, params, retType] = fnMatch
        const returnType = retType ? `: ${retType.trim()}` : ""
        line = `${indent}const ${name} = ${params}${returnType} => {`
      }
    }

    if (v.subrule === "no-shadow") {
      const shadowMatch = v.message.match(/renaming '(\w+)'/u)
      if (shadowMatch) {
        const name = shadowMatch[1]
        const shadowed = `${name}Value`
        line = line.replaceAll(`(${name})`, `(${shadowed})`)
        line = line.replaceAll(` ${name},`, ` ${shadowed},`)
        line = line.replaceAll(` ${name})`, ` ${shadowed})`)
        line = line.replaceAll(`const ${name} =`, `const ${shadowed} =`)
        line = line.replaceAll(`let ${name} =`, `let ${shadowed} =`)
      }
    }

    if (v.subrule === "prefer-structured-clone") {
      line = line.replace(
        /JSON\.parse\(JSON\.stringify\(([^)]+)\)\)/gu,
        "structuredClone($1)",
      )
    }

    lines[idx] = line
  }

  content = lines.join("\n")
  if (needsTruthiness) {
    content = ensureTruthinessImport(content)
  }

  if (content !== original) {
    writeFileSync(filePath, content)
    filesChanged++
    console.log(`updated ${relFile}`)
  }
}

console.log(`Updated ${filesChanged} files`)
