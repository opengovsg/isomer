import { describe, expect, it } from "vitest"
import { DATE_FILTER_STATUS } from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import { getDateFilterStatus } from "../getDateFilterStatus"

describe("getDateFilterStatus", () => {
  const TODAY = "2026-06-15"

  it("returns upcoming when today is before a single date", () => {
    // Arrange / Act
    const result = getDateFilterStatus({ date: "2026-06-16", today: TODAY })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Upcoming.id)
  })

  it("returns ongoing on the single date itself", () => {
    // Arrange / Act
    const result = getDateFilterStatus({ date: TODAY, today: TODAY })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })

  it("returns ended when today is after a single date", () => {
    // Arrange / Act
    const result = getDateFilterStatus({ date: "2026-06-14", today: TODAY })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ended.id)
  })

  it("returns upcoming when today is before a range's start", () => {
    // Arrange / Act
    const result = getDateFilterStatus({
      date: "2026-06-20",
      endDate: "2026-06-25",
      today: TODAY,
    })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Upcoming.id)
  })

  it("returns ongoing on the range's start date (inclusive)", () => {
    // Arrange / Act
    const result = getDateFilterStatus({
      date: TODAY,
      endDate: "2026-06-20",
      today: TODAY,
    })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })

  it("returns ongoing on the range's end date (inclusive)", () => {
    // Arrange / Act
    const result = getDateFilterStatus({
      date: "2026-06-01",
      endDate: TODAY,
      today: TODAY,
    })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })

  it("returns ongoing strictly between a range's start and end", () => {
    // Arrange / Act
    const result = getDateFilterStatus({
      date: "2026-06-01",
      endDate: "2026-06-30",
      today: TODAY,
    })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })

  it("returns ended when today is after a range's end", () => {
    // Arrange / Act
    const result = getDateFilterStatus({
      date: "2026-05-01",
      endDate: "2026-05-31",
      today: TODAY,
    })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ended.id)
  })

  it("defaults `today` to the current date in Asia/Singapore when omitted", () => {
    // Arrange
    const todayInSg = getSingaporeDateYYYYMMDD()

    // Act
    const result = getDateFilterStatus({ date: todayInSg })

    // Assert
    expect(result).toEqual(DATE_FILTER_STATUS.Ongoing.id)
  })
})
