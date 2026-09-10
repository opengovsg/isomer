import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DATE_FILTER_STATUS_ID } from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import { getDateFilterStatus } from "../getDateFilterStatus"

describe("getDateFilterStatus", () => {
  const TODAY = "2026-06-15"

  beforeEach(() => {
    vi.useFakeTimers()
    // Noon Singapore time on the fixed "today" used by the cases below.
    vi.setSystemTime(new Date(`${TODAY}T12:00:00+08:00`))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns upcoming when today is before a single date", () => {
    expect(getDateFilterStatus({ date: "2026-06-16" })).toEqual(
      DATE_FILTER_STATUS_ID.Upcoming,
    )
  })

  it("returns ongoing on the single date itself", () => {
    expect(getDateFilterStatus({ date: TODAY })).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })

  it("returns ended when today is after a single date", () => {
    expect(getDateFilterStatus({ date: "2026-06-14" })).toEqual(
      DATE_FILTER_STATUS_ID.Ended,
    )
  })

  it("returns upcoming when today is before a range's start", () => {
    expect(
      getDateFilterStatus({ date: "2026-06-20", endDate: "2026-06-25" }),
    ).toEqual(DATE_FILTER_STATUS_ID.Upcoming)
  })

  it("returns ongoing on the range's start date (inclusive)", () => {
    expect(getDateFilterStatus({ date: TODAY, endDate: "2026-06-20" })).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })

  it("returns ongoing on the range's end date (inclusive)", () => {
    expect(getDateFilterStatus({ date: "2026-06-01", endDate: TODAY })).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })

  it("returns ongoing strictly between a range's start and end", () => {
    expect(
      getDateFilterStatus({ date: "2026-06-01", endDate: "2026-06-30" }),
    ).toEqual(DATE_FILTER_STATUS_ID.Ongoing)
  })

  it("returns ended when today is after a range's end", () => {
    expect(
      getDateFilterStatus({ date: "2026-05-01", endDate: "2026-05-31" }),
    ).toEqual(DATE_FILTER_STATUS_ID.Ended)
  })

  it("uses the current date in Asia/Singapore", () => {
    vi.useRealTimers()
    const todayInSg = getSingaporeDateYYYYMMDD()

    expect(getDateFilterStatus({ date: todayInSg })).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })
})
