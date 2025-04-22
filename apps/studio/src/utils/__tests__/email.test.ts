import { describe, expect, it } from "vitest"

import { isGovEmail } from "../email"

describe("isGovEmail", () => {
  it("should return true for valid .gov.sg email addresses", () => {
    const validEmails = [
      "test@open.gov.sg",
      "user@agency.gov.sg",
      "name@department.gov.sg",
      "test.user@ministry.gov.sg",
      "first.last@subdomain.agency.gov.sg",
    ]

    validEmails.forEach((email) => {
      expect(isGovEmail(email)).toBe(true)
    })
  })

  it("should return false for non-.gov.sg email addresses", () => {
    const invalidEmails = [
      "test@example.com",
      "user@gmail.com",
      "name@yahoo.com",
      "test@govsg.com",
      "user@gov.sg.com",
      "test@agency.gov.com",
    ]

    invalidEmails.forEach((email) => {
      expect(isGovEmail(email)).toBe(false)
    })
  })

  it("should return false for invalid email formats", () => {
    const invalidFormats = [
      "not-an-email",
      "@gov.sg",
      "test@",
      "test@.gov.sg",
      ".gov.sg",
      "",
      null,
      undefined,
      123,
      {},
      [],
    ]

    invalidFormats.forEach((input) => {
      expect(isGovEmail(input)).toBe(false)
    })
  })
})
