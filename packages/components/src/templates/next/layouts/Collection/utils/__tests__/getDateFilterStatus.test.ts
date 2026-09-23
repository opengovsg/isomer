import { format, parse } from "date-fns"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DATE_FILTER_STATUS } from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import { getDateFilterStatus } from "../getDateFilterStatus"

describe("getDateFilterStatus", () => {
  const TODAY_ISO = "2026-06-15"
  const TODAY = "15/06/2026"

  beforeEach(() => {
    vi.useFakeTimers()
    // Noon Singapore time on the fixed "today" used by the cases below.
    vi.setSystemTime(new Date(`${TODAY_ISO}T12:00:00+08:00`))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns upcoming when today is before a single date", () => {
    expect(getDateFilterStatus({ date: "16/06/2026" })).toEqual(
      DATE_FILTER_STATUS.Upcoming.id,
    )
  })

  it("returns ongoing on the single date itself", () => {
    expect(getDateFilterStatus({ date: TODAY })).toEqual(
      DATE_FILTER_STATUS.Ongoing.id,
    )
  })

  it("returns ended when today is after a single date", () => {
    expect(getDateFilterStatus({ date: "14/06/2026" })).toEqual(
      DATE_FILTER_STATUS.Ended.id,
    )
  })

  it("returns upcoming when today is before a range's start", () => {
    expect(
      getDateFilterStatus({ date: "20/06/2026", endDate: "25/06/2026" }),
    ).toEqual(DATE_FILTER_STATUS.Upcoming.id)
  })

  it("returns ongoing on the range's start date (inclusive)", () => {
    expect(getDateFilterStatus({ date: TODAY, endDate: "20/06/2026" })).toEqual(
      DATE_FILTER_STATUS.Ongoing.id,
    )
  })

  it("returns ongoing on the range's end date (inclusive)", () => {
    expect(getDateFilterStatus({ date: "01/06/2026", endDate: TODAY })).toEqual(
      DATE_FILTER_STATUS.Ongoing.id,
    )
  })

  it("returns ongoing strictly between a range's start and end", () => {
    expect(
      getDateFilterStatus({ date: "01/06/2026", endDate: "30/06/2026" }),
    ).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })

  it("returns ended when today is after a range's end", () => {
    expect(
      getDateFilterStatus({ date: "01/05/2026", endDate: "31/05/2026" }),
    ).toEqual(DATE_FILTER_STATUS.Ended.id)
  })

  it("uses the current date in Asia/Singapore", () => {
    vi.useRealTimers()
    const todayInSg = format(
      parse(getSingaporeDateYYYYMMDD(), "yyyy-MM-dd", new Date()),
      "dd/MM/yyyy",
    )

    expect(getDateFilterStatus({ date: todayInSg })).toEqual(
      DATE_FILTER_STATUS.Ongoing.id,
    )
  })
})
