import { describe, expect, it } from "vitest"

import { getAskgovIdFromString } from "../getAskgovIdFromString"

describe("getAskgovIdFromString", () => {
  it.each(["mha", "custom/agency", " agency-id "])(
    "returns the plain ID %j unchanged",
    (agencyId) => {
      expect(getAskgovIdFromString(agencyId)).toBe(agencyId)
    },
  )

  it.each([
    ["https://ask.gov.sg/mha", "mha"],
    ["http://ask.gov.sg/mom/", "mom"],
    ["https://www.ask.gov.sg/ogp", "ogp"],
    ["http://www.ask.gov.sg/help/questions/question-id", "help"],
    ["https://ask.gov.sg/mha?topic=scams#contact", "mha"],
    ["HTTPS://WWW.ASK.GOV.SG/MHA/questions/question-id", "MHA"],
    ["ask.gov.sg/mha", "mha"],
    ["www.ask.gov.sg/help/questions/question-id", "help"],
    ["ASK.GOV.SG/MHA?topic=scams#contact", "MHA"],
  ])("extracts %j as %j", (value, expected) => {
    expect(getAskgovIdFromString(value)).toBe(expected)
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
    expect(getAskgovIdFromString(value)).toBeNull()
  })
})
