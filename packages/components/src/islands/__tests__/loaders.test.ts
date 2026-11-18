import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { islandLoaders } from "../loaders"

const SRC = path.resolve(__dirname, "../..")

const islandNamesInSource = () => {
  const names: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (
        /\.tsx?$/.test(entry.name) &&
        !/\.(test|stories)\./.test(entry.name)
      )
        for (const match of fs
          .readFileSync(file, "utf8")
          .matchAll(/=\s*island\(\s*"(\w+)"/g))
          names.push(match[1]!)
    }
  }
  walk(SRC)
  return names.sort()
}

describe("islandLoaders", () => {
  it("has a loader for every island() in the package, and nothing else", () => {
    expect(Object.keys(islandLoaders).sort()).toEqual(islandNamesInSource())
  })

  // Imports every island module (Algolia, react-aria, …), so give it more than the default 5 s.
  it(
    "loads the island registered under each name",
    { timeout: 30_000 },
    async () => {
      const loaded = await Promise.all(
        Object.entries(islandLoaders).map(async ([name, load]) => [
          name,
          ((await load()) as { displayName?: string } | undefined)?.displayName,
        ]),
      )
      for (const [name, displayName] of loaded)
        expect(displayName, name).toBe(`Island(${name})`)
    },
  )
})
