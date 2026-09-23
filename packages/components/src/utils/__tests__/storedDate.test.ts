import { describe, expect, it } from "vitest"

import {
  formatStoredDate,
  parseStoredDate,
  STORED_DATE_FORMAT,
  storedDateToIso,
} from "../storedDate"

describe("storedDate", () => {
  it("uses dd/MM/yyyy, the same shape as an article date", () => {
    expect(STORED_DATE_FORMAT).toEqual("dd/MM/yyyy")
  })

  it("parses a zero-padded dd/MM/yyyy calendar date", () => {
    const parsed = parseStoredDate("31/01/2024")

    expect(parsed).toBeInstanceOf(Date)
    expect(parsed?.getFullYear()).toEqual(2024)
    expect(parsed?.getMonth()).toEqual(0)
    expect(parsed?.getDate()).toEqual(31)
  })

  it("rejects an ISO date and a calendar-impossible slash date", () => {
    expect(parseStoredDate("2024-01-31")).toBeUndefined()
    expect(parseStoredDate("31/02/2024")).toBeUndefined()
    expect(parseStoredDate("31/1/2024")).toBeUndefined()
  })

  it("formats a date as dd/MM/yyyy", () => {
    expect(formatStoredDate(new Date(2024, 0, 31))).toEqual("31/01/2024")
  })

  it("converts a stored date to yyyy-MM-dd for comparison with URL ranges", () => {
    expect(storedDateToIso("31/01/2024")).toEqual("2024-01-31")
    expect(storedDateToIso("2024-01-31")).toBeUndefined()
  })
})
