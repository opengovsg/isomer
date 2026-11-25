// Picks which Storybook stories CI must snapshot for a pull request.
//
// Prints `base=<merge-base sha>` when Vitest can run only the stories affected
// by the diff (`vitest --changed=<base>`), or `base=` when the full suite must
// run (main, or any change Vitest's module graph cannot see).
import { execFileSync } from "node:child_process"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import nodePath from "node:path"
import { fileURLToPath } from "node:url"

const root = nodePath.resolve(fileURLToPath(new URL("../..", import.meta.url)))

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 })

// Tailwind utilities and CSS-in-JS class names are generated from every scanned
// file, so a class that no other file already uses can restyle any story.
const tokens = (text) => new Set(text.match(/[^\s"'`]+/g) ?? [])

const SOURCE_EXTS = [".tsx", ".ts", ".mts", ".mjs", ".jsx", ".js"]

function resolveModule(absPath) {
  const candidates = nodePath.extname(absPath)
    ? [absPath]
    : SOURCE_EXTS.flatMap((ext) => [
        absPath + ext,
        nodePath.join(absPath, `index${ext}`),
      ])
  return candidates.find((candidate) => existsSync(candidate))
}

/** `~/` and relative value specifiers from one file, as repo-relative prefixes. */
function localImportPrefixes(project, file) {
  const prefixes = []
  const text = readFileSync(file, "utf8")
  for (const match of text.matchAll(/from ["']([^"']+)["']/g)) {
    const before = text.slice(0, match.index)
    const start = Math.max(
      before.lastIndexOf("import "),
      before.lastIndexOf("export "),
    )
    const clause = before.slice(start)
    // A previous statement sits between this specifier and the keyword.
    if (start === -1 || clause.includes(";")) continue
    // Type-only imports do not change the rendered preview.
    if (/^(?:import|export)\s+type\b/.test(clause)) continue
    const spec = match[1]
    if (spec.startsWith("~/")) {
      prefixes.push(`${project}/src/${spec.slice(2)}`)
      continue
    }
    if (!spec.startsWith(".")) continue
    const rel = nodePath.relative(
      root,
      nodePath.resolve(nodePath.dirname(file), spec),
    )
    if (rel.startsWith(`${project}/src/`)) prefixes.push(rel)
  }
  return prefixes
}

/**
 * Preview decorators/providers are loaded as Vitest setup files, outside the
 * story module graph, so changing anything they import must run every story.
 * One extra hop covers modules those preview imports pull in (for example
 * `~/lib/growthbook` via `~/stories/utils/growthbook`).
 */
export function previewImports(project) {
  const preview = nodePath.join(root, project, ".storybook/preview.tsx")
  const direct = localImportPrefixes(project, preview).filter((prefix) =>
    prefix.startsWith(`${project}/src/`),
  )
  const prefixes = new Set(direct)
  for (const prefix of direct) {
    const file = resolveModule(nodePath.join(root, prefix))
    if (!file) continue
    for (const next of localImportPrefixes(project, file)) prefixes.add(next)
  }
  return [...prefixes]
}

export function requiresFullRun(changes, project, preview = []) {
  const source = new RegExp(`^${project}/src/.*\\.[cm]?[jt]sx?$`)
  return changes.some(({ status, path }) => {
    if (path.startsWith("docs/") || /^[^/]+\.md$/.test(path)) return false
    if (preview.some((prefix) => path.startsWith(prefix))) return true
    // Anything outside the project's own source (workspace packages, config,
    // assets, lockfile) can escape Vitest's dependency graph.
    return status === "D" || status === "T" || !source.test(path)
  })
}

/** True if the diff introduces a class-like token no other source file has. */
export function addsNewTokens(changes, base, project) {
  const existing = tokens(
    git(
      "grep",
      "-h",
      "-I",
      "-o",
      "-E",
      "[^[:space:]\"'`]+",
      base,
      "--",
      `${project}/src`,
    ),
  )
  for (const { status, path } of changes) {
    if (!path.startsWith(`${project}/src/`)) continue
    const before =
      status === "A" ? new Set() : tokens(git("show", `${base}:${path}`))
    for (const token of tokens(git("show", `HEAD:${path}`))) {
      if (!before.has(token) && !existing.has(token)) return true
    }
  }
  return false
}

export function affectedBase(baseSha, project) {
  if (!baseSha) return ""
  const base = git("merge-base", baseSha, "HEAD").trim()
  const diff = git(
    "diff",
    "--name-status",
    "--no-renames",
    "-z",
    base,
    "HEAD",
  ).split("\0")
  const changes = []
  for (let index = 0; index < diff.length - 1; index += 2) {
    changes.push({ status: diff[index], path: diff[index + 1] })
  }
  if (requiresFullRun(changes, project, previewImports(project))) return ""
  return addsNewTokens(changes, base, project) ? "" : base
}

if (import.meta.main) {
  const base = affectedBase(
    process.env.ARGOS_BASE_SHA,
    process.env.STORYBOOK_PROJECT,
  )
  appendFileSync(process.env.GITHUB_OUTPUT, `base=${base}\n`)
}
