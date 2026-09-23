import { describe, expect, it } from "vitest"

import { editLinkSchema } from "../collection"

const LINK_BASE = {
  category: "category",
  linkId: 1,
  siteId: 1,
  ref: "1",
}

const DATE_FILTER_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("editLinkSchema dateTagged", () => {
  it("accepts a date and optional end date stored as dd/MM/yyyy", () => {
    const result = editLinkSchema.parse({
      ...LINK_BASE,
      dateTagged: [
        {
          id: DATE_FILTER_ID,
          date: "15/01/2026",
          endDate: "20/01/2026",
        },
      ],
    })

    expect(result.dateTagged).toEqual([
      {
        id: DATE_FILTER_ID,
        date: "15/01/2026",
        endDate: "20/01/2026",
      },
    ])
  })

  it("rejects an ISO date on a dateTagged entry", () => {
    const result = editLinkSchema.safeParse({
      ...LINK_BASE,
      dateTagged: [{ id: DATE_FILTER_ID, date: "2026-01-15" }],
    })

    expect(result.success).toBe(false)
  })

  it("rejects a calendar-impossible dd/MM/yyyy date", () => {
    const result = editLinkSchema.safeParse({
      ...LINK_BASE,
      dateTagged: [{ id: DATE_FILTER_ID, date: "31/02/2026" }],
    })

    expect(result.success).toBe(false)
  })
})
