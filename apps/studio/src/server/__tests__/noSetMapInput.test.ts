import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"

// Enforces the assumption behind safeTransformer.ts: this app never sends a Set
// or Map over tRPC, so the transformer can hard-reject them to close the
// superjson O(n²) deserialization DoS. If you must add one, remove the guard's
// shortcut instead of silencing this test.
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const BANNED = /\bz\.(set|map)\s*\(/

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (/\.(ts|tsx)$/.test(entry.name)) yield path
  }
}

describe("no Set/Map in tRPC input schemas", () => {
  it("has no z.set() or z.map() anywhere in src", () => {
    const offenders = [...walk(SRC)]
      .filter((f) => !f.endsWith("noSetMapInput.test.ts")) // this file names the banned call
      .filter((f) => BANNED.test(readFileSync(f, "utf8")))
    expect(offenders).toEqual([])
  })
})
