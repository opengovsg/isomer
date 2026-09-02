import { describe, expect, it } from "vitest"
import { DATE_FILTER_STATUS_ID } from "~/types/constants"

import { getDateFilterStatus } from "../getDateFilterStatus"

describe("getDateFilterStatus", () => {
  const TODAY = "2026-06-15"

  it("returns upcoming when today is before a single date", () => {
    expect(getDateFilterStatus({ date: "2026-06-16" }, TODAY)).toEqual(
      DATE_FILTER_STATUS_ID.Upcoming,
    )
  })

  it("returns ongoing on the single date itself", () => {
    expect(getDateFilterStatus({ date: TODAY }, TODAY)).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })

  it("returns ended when today is after a single date", () => {
    expect(getDateFilterStatus({ date: "2026-06-14" }, TODAY)).toEqual(
      DATE_FILTER_STATUS_ID.Ended,
    )
  })

  it("returns upcoming when today is before a range's start", () => {
    expect(
      getDateFilterStatus({ date: "2026-06-20", endDate: "2026-06-25" }, TODAY),
    ).toEqual(DATE_FILTER_STATUS_ID.Upcoming)
  })

  it("returns ongoing on the range's start date (inclusive)", () => {
    expect(
      getDateFilterStatus({ date: TODAY, endDate: "2026-06-20" }, TODAY),
    ).toEqual(DATE_FILTER_STATUS_ID.Ongoing)
  })

  it("returns ongoing on the range's end date (inclusive)", () => {
    expect(
      getDateFilterStatus({ date: "2026-06-01", endDate: TODAY }, TODAY),
    ).toEqual(DATE_FILTER_STATUS_ID.Ongoing)
  })

  it("returns ongoing strictly between a range's start and end", () => {
    expect(
      getDateFilterStatus({ date: "2026-06-01", endDate: "2026-06-30" }, TODAY),
    ).toEqual(DATE_FILTER_STATUS_ID.Ongoing)
  })

  it("returns ended when today is after a range's end", () => {
    expect(
      getDateFilterStatus({ date: "2026-05-01", endDate: "2026-05-31" }, TODAY),
    ).toEqual(DATE_FILTER_STATUS_ID.Ended)
  })

  it("defaults `today` to the current date in Asia/Singapore when omitted", () => {
    const todayInSg = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
    }).format(new Date())

    expect(getDateFilterStatus({ date: todayInSg })).toEqual(
      DATE_FILTER_STATUS_ID.Ongoing,
    )
  })
})
