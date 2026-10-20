// Picks which Storybook stories CI must snapshot for a pull request.
//
// Prints `base=<merge-base sha>` when Vitest can run only the stories affected
// by the diff (`vitest --changed=<base>`), or `base=` when the full suite must
// run (main, or any change Vitest's module graph cannot see).
import { execFileSync } from "node:child_process"
import { appendFileSync, readFileSync } from "node:fs"
import nodePath from "node:path"
import { fileURLToPath } from "node:url"

const root = nodePath.resolve(fileURLToPath(new URL("../..", import.meta.url)))

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 })

// Tailwind utilities and CSS-in-JS class names are generated from every scanned
// file, so a class that no other file already uses can restyle any story.
const tokens = (text) => new Set(text.match(/[^\s"'`]+/g) ?? [])

/**
 * Preview decorators/providers are loaded as Vitest setup files, outside the
 * story module graph, so changing anything they import must run every story.
 */
export function previewImports(project) {
  const preview = nodePath.join(root, project, ".storybook/preview.tsx")
  return [...readFileSync(preview, "utf8").matchAll(/from "~\/([^"]+)"/g)].map(
    (match) => `${project}/src/${match[1]}`,
  )
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
