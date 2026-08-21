import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

const E2E_DIR = "tests/e2e"
const CI_WORKFLOW = "../../.github/workflows/ci.yml"
const NON_TEST_DIRS = new Set(["fixtures", "storage-state", "test-results"])

// `tests/e2e/page/` is CI-sharded into blocks/settings/flows subdirs — each
// subdir is its own matrix job, not the parent `page/` directory.
const PAGE_E2E_SHARD_SUBDIRS = ["blocks", "settings", "flows"] as const

function discoveredUnits(): string[] {
  const units: string[] = []
  for (const entry of readdirSync(E2E_DIR)) {
    if (NON_TEST_DIRS.has(entry)) continue
    const full = join(E2E_DIR, entry)
    if (entry === "page" && statSync(full).isDirectory()) {
      for (const sub of PAGE_E2E_SHARD_SUBDIRS) {
        units.push(join(full, sub))
      }
      continue
    }
    if (statSync(full).isDirectory() || entry.endsWith(".test.ts")) {
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
      "A tests/e2e directory or root test file isn't listed in any `paths:` " +
        "entry in the e2e-tests CI matrix in .github/workflows/ci.yml, " +
        "or is listed more than once. If you added a new " +
        "tests/e2e/<feature> directory, add an entry for it there.",
    ).toEqual(discoveredUnits())
  })
})
