import { describe, expect, it } from "vitest"

import { getParsedDate } from "../getParsedDate"

describe("getParsedDate", () => {
  it("parses dd/MM/yyyy format correctly", () => {
    const result = getParsedDate("25/12/2023")
    expect(result).toStrictEqual(new Date(2023, 11, 25))
  })

  it("parses d MMM yyyy format correctly", () => {
    const result = getParsedDate("5 Jan 2023")
    expect(result).toStrictEqual(new Date(2023, 0, 5))
  })

  it("parses d MMMM yyyy format correctly", () => {
    const result = getParsedDate("15 March 2023")
    expect(result).toStrictEqual(new Date(2023, 2, 15))
  })

  it("parses dd MMM yyyy format correctly", () => {
    const result = getParsedDate("05 Apr 2023")
    expect(result).toStrictEqual(new Date(2023, 3, 5))
  })

  it("parses dd MMMM yyyy format correctly", () => {
    const result = getParsedDate("30 November 2023")
    expect(result).toStrictEqual(new Date(2023, 10, 30))
  })

  it("parses yyyy-MM-dd format correctly", () => {
    const result = getParsedDate("2023-06-15")
    expect(result).toStrictEqual(new Date(2023, 5, 15))
  })

  it("parses ISO 8601 format correctly in Singapore timezone", () => {
    const result = getParsedDate("2023-07-20T16:00:00.000Z")
    expect(result).toStrictEqual(new Date(2023, 6, 21, 0, 0, 0, 0))
  })

  it("returns current date for unsupported format", () => {
    const result = getParsedDate("unsupported format")
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeCloseTo(new Date().getTime(), -3) // Allow 1 second difference
  })

  it("returns current date for invalid date", () => {
    const result = getParsedDate("32/13/2023") // Invalid date
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeCloseTo(new Date().getTime(), -3) // Allow 1 second difference
  })
})
