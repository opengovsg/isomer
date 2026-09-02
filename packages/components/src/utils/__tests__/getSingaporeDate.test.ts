import { describe, expect, it } from "vitest"

import { getSingaporeDateYYYYMMDD } from "../getSingaporeDate"

describe("getSingaporeDateYYYYMMDD", () => {
  it("formats a known UTC instant as the Singapore calendar date", () => {
    // 2026-06-15 20:00 UTC = 2026-06-16 04:00 SGT
    const date = new Date("2026-06-15T20:00:00.000Z")

    expect(getSingaporeDateYYYYMMDD(date)).toEqual("2026-06-16")
  })

  it("returns a yyyy-MM-dd string", () => {
    expect(getSingaporeDateYYYYMMDD()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
