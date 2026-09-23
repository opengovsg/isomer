import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"
import { IsomerPageSchema } from "~/types/schema"

describe("page layouts", () => {
  it("accepts file URLs through link layouts and rejects the removed file layout", () => {
    const page = {
      version: "0.1.0",
      layout: "link",
      page: { category: "Publications", ref: "https://example.com/report.pdf" },
      content: [],
    }

    expect(Value.Check(IsomerPageSchema, page)).toBe(true)
    expect(Value.Check(IsomerPageSchema, { ...page, layout: "file" })).toBe(
      false,
    )
  })
})
