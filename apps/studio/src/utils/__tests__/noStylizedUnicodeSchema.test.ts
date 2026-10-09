import {
  AgencySettingsSchema,
  attachIsomerSharedDefinitions,
  IsomerString,
  NON_EMPTY_STRING_REGEX,
  NO_STYLIZED_UNICODE_REGEX,
  NO_STYLIZED_UNICODE_STRING_ID,
  schema,
  SiteConfigSchema,
} from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"
import { ajv } from "~/utils/ajv"

const unicodeMessage =
  "cannot contain stylised or decorative unicode characters"

const compileField = (field: ReturnType<typeof IsomerString>) =>
  ajv.compile(
    attachIsomerSharedDefinitions({
      type: "object",
      properties: { value: field },
      required: ["value"],
    }),
  )

const errorMessages = (validate: { errors?: { message?: string }[] | null }) =>
  (validate.errors ?? []).map((error) => error.message)

describe("no stylized unicode schema", () => {
  it("should allow valid links and reject stylized unicode and unsupported protocols", () => {
    // Arrange
    // Alternation has to stay inside the caller's pattern. The unicode check
    // is a separate schema, so it still applies to every branch.
    const validate = compileField(
      IsomerString({ pattern: "(^https://)|(^tel:)" }),
    )

    // Act / Assert
    expect(validate({ value: "tel:12345678" })).toBe(true)
    expect(validate({ value: "https://example.com" })).toBe(true)

    expect(validate({ value: "ftp://example.com" })).toBe(false)
    expect(errorMessages(validate)).not.toContain(unicodeMessage)

    expect(validate({ value: "𝐭𝐞𝐥:12345678" })).toBe(false)
    expect(errorMessages(validate)).toContain(unicodeMessage)
    expect(validate({ value: "𝐡𝐭𝐭𝐩𝐬://example.com" })).toBe(false)
    expect(errorMessages(validate)).toContain(unicodeMessage)
  })

  it("should allow non-empty text and reject empty or stylized text", () => {
    // Arrange
    const validate = compileField(
      IsomerString({
        pattern: NON_EMPTY_STRING_REGEX,
        errorMessage: { pattern: "cannot be empty or contain only spaces" },
      }),
    )

    // Act / Assert
    expect(validate({ value: "hello" })).toBe(true)

    expect(validate({ value: "" })).toBe(false)
    expect(errorMessages(validate)).toContain(
      "cannot be empty or contain only spaces",
    )
    expect(errorMessages(validate)).not.toContain(unicodeMessage)

    expect(validate({ value: "𝐡𝐞𝐥𝐥𝐨" })).toBe(false)
    expect(errorMessages(validate)).toContain(unicodeMessage)
    expect(errorMessages(validate)).not.toContain(
      "cannot be empty or contain only spaces",
    )
  })

  it("should compile the lookahead once when the page schema is compiled", () => {
    // Arrange / Act
    const validatePage = ajv.compile(schema)
    const shared = ajv.getSchema(NO_STYLIZED_UNICODE_STRING_ID)

    // Assert
    expect(validatePage({ layout: "content" })).toBe(false)
    expect(shared).toBeTypeOf("function")
    expect(shared?.toString()).toContain("D835")
    expect(validatePage.toString()).not.toContain("D835")
    expect(NO_STYLIZED_UNICODE_REGEX).toContain("D835")
  })

  it("should resolve the shared schema for settings compiled without the page document", () => {
    // Arrange
    const validateAgency = ajv.compile(
      attachIsomerSharedDefinitions(AgencySettingsSchema),
    )
    const validateSite = ajv.compile(
      attachIsomerSharedDefinitions(SiteConfigSchema),
    )

    // Act / Assert
    expect(validateAgency({ siteName: "Official" })).toBe(true)
    expect(validateAgency({ siteName: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" })).toBe(false)
    expect(errorMessages(validateAgency)).toContain(unicodeMessage)
    expect(validateSite({ siteName: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" })).toBe(false)
    expect(errorMessages(validateSite)).toContain(unicodeMessage)
  })
})
