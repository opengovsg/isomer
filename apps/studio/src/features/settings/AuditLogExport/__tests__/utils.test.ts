import { describe, expect, it } from "vitest"

import { getMonthOptions } from "../utils"

describe(getMonthOptions, () => {
  it("returns the current month first, newest to oldest, with no future months", () => {
    // 2026-06-30 08:00 UTC = 2026-06-30 16:00 SGT, so the Singapore month is June.
    const options = getMonthOptions(new Date("2026-06-30T08:00:00.000Z"))

    // 12 months inclusive of the current month: June 2026 back to July 2025.
    expect(options).toHaveLength(12)
    expect([options[0], options[1], options.at(-1)]).toStrictEqual([
      { value: "2026-06", label: "June 2026" },
      { value: "2026-05", label: "May 2026" },
      { value: "2025-07", label: "July 2025" },
    ])

    const values = options.map((o) => o.value)
    expect({
      allPast: values.every((v) => v <= "2026-06"),
      validFormat: /^\d{4}-(0[1-9]|1[0-2])$/.test(values[0]!),
    }).toStrictEqual({ allPast: true, validFormat: true })
  })

  it("uses Singapore time at the UTC day boundary", () => {
    // 2026-06-30 17:00 UTC = 2026-07-01 01:00 SGT, so the Singapore month rolls
    // over to July ahead of UTC.
    const options = getMonthOptions(new Date("2026-06-30T17:00:00.000Z"))

    expect(options[0]).toStrictEqual({ value: "2026-07", label: "July 2026" })
  })

  it("caps the option count when maxMonths is smaller than the full window", () => {
    // A site younger than the standard window only offers its own age's worth
    // of months (see getMaxExportableMonths).
    const options = getMonthOptions(new Date("2026-06-30T08:00:00.000Z"), 3)

    expect(options).toHaveLength(3)
    expect(options[0]).toStrictEqual({ value: "2026-06", label: "June 2026" })
    expect(options.at(-1)).toStrictEqual({
      value: "2026-04",
      label: "April 2026",
    })
  })

  it("still returns at least the current month if maxMonths is 0 or negative", () => {
    const options = getMonthOptions(new Date("2026-06-30T08:00:00.000Z"), 0)

    expect(options).toHaveLength(1)
    expect(options[0]).toStrictEqual({ value: "2026-06", label: "June 2026" })
  })
})
