import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

const E2E_DIR = "tests/e2e"
const CI_WORKFLOW = "../../.github/workflows/ci.yml"
const NON_TEST_DIRS = new Set(["fixtures", "storage-state", "test-results"])

const hasDirectTestFiles = (dir: string): boolean =>
  readdirSync(dir).some(
    (entry) =>
      entry.endsWith(".test.ts") && statSync(join(dir, entry)).isFile(),
  )

/** Immediate child dirs that contain at least one `*.test.ts`. */
const subdirsWithTests = (parent: string): string[] =>
  readdirSync(parent)
    .filter((entry) => {
      const full = join(parent, entry)
      return statSync(full).isDirectory() && hasDirectTestFiles(full)
    })
    .map((entry) => join(parent, entry))

function discoveredUnits(): string[] {
  const units: string[] = []
  for (const entry of readdirSync(E2E_DIR)) {
    if (NON_TEST_DIRS.has(entry)) continue
    const full = join(E2E_DIR, entry)
    if (statSync(full).isDirectory()) {
      if (hasDirectTestFiles(full)) {
        units.push(full)
      } else {
        const shards = subdirsWithTests(full)
        units.push(...(shards.length > 0 ? shards : [full]))
      }
      continue
    }
    if (entry.endsWith(".test.ts")) {
      units.push(full)
    }
  }
  return units.sort()
}

// The e2e-tests CI job's matrix declares one `paths: <space-separated
// tests/e2e/... paths>` line per feature job. Extracted by key rather than a
// blanket "tests/e2e/" regex, since other steps in the same workflow
// reference tests/e2e paths too (e.g. the test-results upload path).
function pathsDeclaredInCi(): string[] {
  const workflow = readFileSync(CI_WORKFLOW, "utf8")
  const pathLines = [...workflow.matchAll(/^\s+paths:\s*(.+)$/gm)]
  return pathLines
    .flatMap((match) => (match[1] ?? "").trim().split(/\s+/))
    .sort()
}

describe("e2e-tests CI matrix", () => {
  it("declares every tests/e2e feature directory and root test file exactly once", () => {
    expect(
      pathsDeclaredInCi(),
      "Missing or duplicate `paths:` in .github/workflows/ci.yml for a tests/e2e " +
        "directory. Dirs without root-level *.test.ts (e.g. page/) need one CI " +
        "entry per child subdir that has tests.",
    ).toEqual(discoveredUnits())
  })
})
