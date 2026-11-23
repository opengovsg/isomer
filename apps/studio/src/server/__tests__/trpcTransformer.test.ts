import { describe, expect, it } from "vitest"

import { safeSuperjson } from "../safeTransformer"
import { router } from "../trpc"

describe("tRPC transformer", () => {
  it("decodes input with safeSuperjson", () => {
    // Arrange / Act
    const { input } = router({})._def._config.transformer

    // Assert
    expect(input.deserialize).toBe(safeSuperjson.deserialize)
  })
})
