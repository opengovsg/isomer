import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"
import { getAskgovIdFromString } from "~/utils/getAskgovIdFromString"

import { AskgovSchema } from "../Askgov"

const isValidAgencyInput = (value: string) =>
  Value.Check(AskgovSchema, { "data-agency": value })

const ACCEPTED = [
  "mha",
  "help2",
  "agency_id",
  " mha ",
  "https://ask.gov.sg/mha",
  "http://ask.gov.sg/mha/",
  "https://www.ask.gov.sg/help/questions/question-id",
  "HTTPS://WWW.ASK.GOV.SG/mha",
  "ask.gov.sg/mha",
  "www.ask.gov.sg/help/questions/question-id",
  "  https://ask.gov.sg/mha  ",
]

const REJECTED = [
  "",
  "   ",
  "custom/agency",
  "example.com/mha",
  "https://example.com/mha",
  "https://ask.gov.sg",
  "https://ask.gov.sg/",
  "https://www.ask.gov.sg?topic=scams",
  "https://staging.ask.gov.sg/mha",
  "https://foo.www.ask.gov.sg/mha",
  "https://ask.gov.sg.example.com/mha",
  "ask.gov.sg",
  "www.ask.gov.sg/",
  "staging.ask.gov.sg/mha",
  "foo.www.ask.gov.sg/mha",
  "ask.gov.sg.example.com/mha",
  "ftp://ask.gov.sg/mha",
  "https://",
]

describe(AskgovSchema, () => {
  it.each(ACCEPTED)("accepts %j", (value) => {
    expect(isValidAgencyInput(value)).toBe(true)
  })

  it.each(REJECTED)("rejects %j", (value) => {
    expect(isValidAgencyInput(value)).toBe(false)
  })

  // The schema gates what a user can save and `getAskgovIdFromString` decides
  // what gets stored, so the two have to agree on every input or the mutation
  // rejects a value the form accepted.
  it.each([...ACCEPTED, ...REJECTED])(
    "agrees with getAskgovIdFromString on %j",
    (value) => {
      expect(isValidAgencyInput(value)).toBe(
        getAskgovIdFromString(value) !== null,
      )
    },
  )

  it("provides the AskGov-specific validation message", () => {
    expect(AskgovSchema.properties["data-agency"]).toMatchObject({
      errorMessage: {
        pattern: "must be an ID or a valid ask.gov.sg URL",
      },
    })
  })
})
