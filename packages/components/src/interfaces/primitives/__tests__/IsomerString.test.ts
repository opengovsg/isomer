import { describe, expect, it } from "vitest"
import { getComponentSchema } from "~/schemas/components"
import { schema } from "~/schemas/main"
import { getLayoutMetadataSchema } from "~/schemas/meta"
import { getLayoutPageSchema, LAYOUT_PAGE_MAP } from "~/schemas/page"
import { attachIsomerSharedDefinitions } from "~/schemas/sharedDefinitions"
import {
  NO_STYLIZED_UNICODE_REGEX,
  NON_EMPTY_STRING_REGEX,
} from "~/utils/validation"

import {
  IsomerString,
  NO_STYLIZED_UNICODE_STRING_ID,
  NoStylizedUnicodeStringSchema,
} from "../IsomerString"

const unicodeMessage =
  "cannot contain stylised or decorative unicode characters"

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
    expect(NoStylizedUnicodeStringSchema.pattern).toBe(
      NO_STYLIZED_UNICODE_REGEX,
    )
    expect(NoStylizedUnicodeStringSchema.errorMessage).toEqual({
      pattern: unicodeMessage,
    })
  })

  it("should keep a caller's pattern and error message instead of joining them", () => {
    // Arrange / Act
    const field = IsomerString({
      pattern: NON_EMPTY_STRING_REGEX,
      errorMessage: { pattern: "cannot be empty or contain only spaces" },
    })

    // Assert
    expect(field.pattern).toBe(NON_EMPTY_STRING_REGEX)
    expect(field.errorMessage).toEqual({
      pattern: "cannot be empty or contain only spaces",
    })
    expect(field.allOf).toEqual([{ $ref: NO_STYLIZED_UNICODE_STRING_ID }])
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
    expect(countInJson(schema, NO_STYLIZED_UNICODE_STRING_ID)).toBeGreaterThan(
      1,
    )
  })

  it("should attach the shared schema on a layout fragment without copying it into the page schema", () => {
    // Arrange / Act
    const contentPage = getLayoutPageSchema("content")
    const contentMeta = getLayoutMetadataSchema("content")

    // Assert
    expect(countInJson(contentPage, NO_STYLIZED_UNICODE_REGEX)).toBe(1)
    expect(countInJson(contentMeta, NO_STYLIZED_UNICODE_REGEX)).toBe(1)
    expect(
      countInJson(LAYOUT_PAGE_MAP.content, NO_STYLIZED_UNICODE_REGEX),
    ).toBe(0)
    expect(attachIsomerSharedDefinitions(schema)).toBe(schema)
    expect(attachIsomerSharedDefinitions(contentPage)).toBe(contentPage)
  })
})
