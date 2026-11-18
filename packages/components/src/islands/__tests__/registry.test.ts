import { describe, expect, it } from "vitest"

import { islands } from "../registry"

describe("islands registry", () => {
  // Imports every island module (Algolia, react-aria, …), so give it more than the default 5 s.
  it(
    "each entry's module exports the island under that name",
    { timeout: 30_000 },
    async () => {
      for (const [name, load] of Object.entries(islands)) {
        const module = (await load()) as Record<
          string,
          { displayName?: string }
        >
        expect(module[name]?.displayName, name).toBe(`Island(${name})`)
      }
    },
  )
})
