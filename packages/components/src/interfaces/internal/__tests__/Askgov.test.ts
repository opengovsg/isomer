import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

import { AskgovSchema } from "../Askgov"

const isValidAgencyInput = (value: string) =>
  Value.Check(AskgovSchema, { "data-agency": value })

describe("AskgovSchema", () => {
  it.each([
    "mha",
    "custom/agency",
    "https://ask.gov.sg/mha",
    "http://ask.gov.sg/mha/",
    "https://www.ask.gov.sg/help/questions/question-id",
    "ask.gov.sg/mha",
    "www.ask.gov.sg/help/questions/question-id",
  ])("accepts %j", (value) => {
    expect(isValidAgencyInput(value)).toBe(true)
  })

  it.each([
    "https://ask.gov.sg",
    "https://ask.gov.sg/",
    "https://www.ask.gov.sg?topic=scams",
    "https://staging.ask.gov.sg/mha",
    "https://foo.www.ask.gov.sg/mha",
    "https://ask.gov.sg.example.com/mha",
    "https://example.com/mha",
    "ask.gov.sg",
    "www.ask.gov.sg/",
    "staging.ask.gov.sg/mha",
    "foo.www.ask.gov.sg/mha",
    "ask.gov.sg.example.com/mha",
    "ftp://ask.gov.sg/mha",
    "https://",
  ])("rejects %j", (value) => {
    expect(isValidAgencyInput(value)).toBe(false)
  })

  it("provides the AskGov-specific validation message", () => {
    expect(AskgovSchema.properties["data-agency"]).toMatchObject({
      errorMessage: {
        pattern: "must be an ID or a valid ask.gov.sg URL",
      },
    })
  })
})
