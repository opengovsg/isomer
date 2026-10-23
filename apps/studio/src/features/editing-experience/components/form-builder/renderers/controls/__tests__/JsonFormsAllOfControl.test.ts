import type { TesterContext, UISchemaElement } from "@jsonforms/core"
import { describe, expect, it } from "vitest"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { jsonFormsAllOfControlTester } from "../JsonFormsAllOfControl"
import { jsonFormsLinkControlTester } from "../JsonFormsLinkControl"
import { jsonFormsTextAreaControlTester } from "../JsonFormsTextAreaControl"
import { jsonFormsTextControlTester } from "../JsonFormsTextControl"

const uischema = {
  type: "Control",
  scope: "#/properties/value",
} as UISchemaElement

const context = {} as TesterContext

describe("jsonFormsAllOfControlTester", () => {
  it("should leave string fields to the format controls", () => {
    // Arrange
    const textarea = {
      type: "string",
      format: "textarea",
      allOf: [{ $ref: "isomer-string-no-stylized-unicode" }],
    }
    const link = {
      type: "string",
      format: "link",
      pattern: "^https://",
      allOf: [{ $ref: "isomer-string-no-stylized-unicode" }],
    }
    const text = {
      type: "string",
      title: "Title",
      allOf: [{ $ref: "isomer-string-no-stylized-unicode" }],
    }

    // Act / Assert
    expect(jsonFormsAllOfControlTester(uischema, textarea, context)).toBe(-1)
    expect(jsonFormsTextAreaControlTester(uischema, textarea, context)).toBe(
      JSON_FORMS_RANKING.TextAreaControl,
    )
    expect(jsonFormsAllOfControlTester(uischema, link, context)).toBe(-1)
    expect(jsonFormsLinkControlTester(uischema, link, context)).toBe(
      JSON_FORMS_RANKING.LinkControl,
    )
    expect(jsonFormsAllOfControlTester(uischema, text, context)).toBe(-1)
    expect(jsonFormsTextControlTester(uischema, text, context)).toBe(
      JSON_FORMS_RANKING.TextControl,
    )
  })

  it("should still match object intersects", () => {
    // Arrange
    const schema = {
      type: "object",
      allOf: [{ properties: { subtitle: { type: "string" } } }],
    }
    const objectControl = {
      type: "Control",
      scope: "#",
    } as UISchemaElement

    // Act
    const rank = jsonFormsAllOfControlTester(objectControl, schema, context)

    // Assert
    expect(rank).toBe(JSON_FORMS_RANKING.AllOfControl)
  })
})
