import { describe, expect, it } from "vitest"
import { z } from "zod"

import { flattenZodErrorForTrpcClient } from "../trpcZodError"

describe("flattenZodErrorForTrpcClient", () => {
  it("returns flattened field errors for BAD_REQUEST Zod failures", () => {
    const schema = z.object({
      siteId: z.number().int().positive(),
    })
    const parseResult = schema.safeParse({ siteId: "nope" })
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      throw new Error("expected validation failure")
    }

    const flattened = flattenZodErrorForTrpcClient(
      "BAD_REQUEST",
      parseResult.error,
    )

    expect(flattened).toEqual({
      formErrors: [],
      fieldErrors: {
        siteId: ["Invalid input: expected number, received string"],
      },
    })
  })

  it("returns null for non-Zod causes", () => {
    expect(
      flattenZodErrorForTrpcClient("BAD_REQUEST", new Error("other")),
    ).toBeNull()
  })

  it("returns null when the procedure error code is not BAD_REQUEST", () => {
    const schema = z.object({ x: z.string() })
    const parseResult = schema.safeParse({})
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      throw new Error("expected validation failure")
    }

    expect(
      flattenZodErrorForTrpcClient("INTERNAL_SERVER_ERROR", parseResult.error),
    ).toBeNull()
  })
})
