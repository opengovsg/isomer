import { describe, expect, it } from "vitest"
import { getComponentSchema } from "~/schemas/components"
import { schema } from "~/schemas/main"
import { NO_STYLIZED_UNICODE_REGEX } from "~/utils/validation"

import { IsomerString, NO_STYLIZED_UNICODE_STRING_ID } from "../IsomerString"

const countInJson = (value: unknown, needle: string) => {
  const haystack = JSON.stringify(value)
  const escaped = JSON.stringify(needle).slice(1, -1)
  return haystack.split(escaped).length - 1
}

describe("IsomerString", () => {
  it("should point at the shared unicode schema and keep field metadata on the node", () => {
    // Arrange / Act
    const field = IsomerString({ title: "Some field", format: "textarea" })

    // Assert
    expect(field.pattern).toBeUndefined()
    expect(field.title).toBe("Some field")
    expect(field.format).toBe("textarea")
    expect(field.allOf).toEqual([{ $ref: NO_STYLIZED_UNICODE_STRING_ID }])
    expect(field.errorMessage).toBeUndefined()
  })

  it("should include the lookahead once on the published page schema and on a component fragment", () => {
    // Arrange / Act / Assert
    expect(countInJson(schema, NO_STYLIZED_UNICODE_REGEX)).toBe(1)
    expect(
      countInJson(
        getComponentSchema({ component: "image" }),
        NO_STYLIZED_UNICODE_REGEX,
      ),
    ).toBe(1)
  })
})
