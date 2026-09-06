import { expect, describe, it } from "vitest"

import { formatEnumLabel } from "../formatEnumLabel"

describe("formatEnumLabel", () => {
  it.each([
    ["Organization", "Organization"],
    ["GovernmentOrganization", "Government Organization"],
    ["EducationalOrganization", "Educational Organization"],
    ["NGO", "NGO"],
    ["facebook", "Facebook"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatEnumLabel(value)).toBe(expected)
  })
})
