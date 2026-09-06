import type { ContactInformationUIProps } from "~/interfaces"
import type { CONTACT_INFORMATION_SUPPORT_METHODS } from "~/interfaces/complex/ContactInformation/constants"
import { describe, expect, it } from "vitest"

import { filterContactMethods } from "../filterContactMethods"

type ExternalContactPayload =
  | string
  | number
  | boolean
  | null
  | undefined
  | ExternalContactPayload[]
  | { [key: string]: ExternalContactPayload }

const hostileContactValues = (
  values: ExternalContactPayload,
): ContactInformationUIProps["methods"][number]["values"] => 
  // SAFETY: Test deliberately passes malformed external values through the filter boundary.
  values as ContactInformationUIProps["methods"][number]["values"]


const hostileContactValue = (value: ExternalContactPayload): string => 
  // SAFETY: Test deliberately passes malformed external values through the filter boundary.
  value as string


const hostileContactMethod = (
  method: ExternalContactPayload,
): ContactInformationUIProps["methods"][number]["method"] => 
  // SAFETY: Test deliberately passes malformed external values through the filter boundary.
  method as ContactInformationUIProps["methods"][number]["method"]


// Helper function to create mock contact methods
const createMockMethods = (
  methodTypes: (typeof CONTACT_INFORMATION_SUPPORT_METHODS)[number][],
): ContactInformationUIProps["methods"] => 
  methodTypes.map((method, index) => ({
    caption: `${method} caption ${index + 1}`,
    label: `${method} label ${index + 1}`,
    method,
    values: [`${method} value ${index + 1}`],
  }))


describe("filterContactMethods", () => {
  describe("when whitelistedMethods is undefined", () => {
    it("should return all methods", () => {
      // Arrange
      const methods = createMockMethods(["telephone", "email", "website"])

      // Act
      const result = filterContactMethods({ methods })

      // Assert
      expect(result).toEqual(methods)
      expect(result).toHaveLength(3)
    })

    it("should return empty array when methods is empty", () => {
      // Arrange
      const methods: ContactInformationUIProps["methods"] = []

      // Act
      const result = filterContactMethods({ methods })

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("when whitelistedMethods is provided", () => {
    it("should return only methods that match whitelisted methods", () => {
      // Arrange
      const methods = createMockMethods([
        "telephone",
        "email",
        "website",
        "fax",
        "address",
      ])
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        ["email", "website"]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]?.method).toBe("email")
      expect(result[1]?.method).toBe("website")
    })

    it("should return methods in the order of whitelistedMethods", () => {
      // Arrange
      const methods = createMockMethods(["telephone", "email", "website"])
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        ["website", "telephone", "email"]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]?.method).toBe("website")
      expect(result[1]?.method).toBe("telephone")
      expect(result[2]?.method).toBe("email")
    })

    it("should return empty array when whitelistedMethods is empty", () => {
      // Arrange
      const methods = createMockMethods(["telephone", "email", "website"])
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        []

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it("should handle duplicate whitelisted methods", () => {
      // Arrange
      const methods = createMockMethods(["telephone", "email"])
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        [
          "telephone",
          "email",
          "telephone", // Duplicate
          "email", // Duplicate
        ]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(4)
      expect(result[0]?.method).toBe("telephone")
      expect(result[1]?.method).toBe("email")
      expect(result[2]?.method).toBe("telephone")
      expect(result[3]?.method).toBe("email")
    })

    it("should handle multiple methods of the same type", () => {
      // Arrange - Create methods with multiple instances of the same type
      const methods: ContactInformationUIProps["methods"] = [
        {
          caption: "Main office",
          label: "Main Phone",
          method: "telephone",
          values: ["+65-1234-5678"],
        },
        {
          caption: "General inquiries",
          label: "General Email",
          method: "email",
          values: ["info@example.com"],
        },
        {
          caption: "Emergency only",
          label: "Emergency Phone",
          method: "telephone",
          values: ["+65-9876-5432"],
        },
        {
          caption: "Official website",
          label: "Main Website",
          method: "website",
          values: ["https://example.com"],
        },
        {
          caption: "Technical support",
          label: "Support Email",
          method: "email",
          values: ["support@example.com"],
        },
      ]
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        ["telephone", "email"]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(4)
      // Should return all telephone methods first (in original order)
      expect(result[0]?.method).toBe("telephone")
      expect(result[0]?.label).toBe("Main Phone")
      expect(result[1]?.method).toBe("telephone")
      expect(result[1]?.label).toBe("Emergency Phone")
      // Then all email methods (in original order)
      expect(result[2]?.method).toBe("email")
      expect(result[2]?.label).toBe("General Email")
      expect(result[3]?.method).toBe("email")
      expect(result[3]?.label).toBe("Support Email")
    })

    it("should filter out methods with falsy method values", () => {
      // Arrange - Include methods with falsy method values
      const methods: ContactInformationUIProps["methods"] = [
        {
          label: "Phone",
          method: "telephone",
          values: ["+65-1234-5678"],
        },
        {
          label: "Invalid Method",
          method: undefined, // Falsy method
          values: ["invalid"],
        },
        {
          label: "Email",
          method: "email",
          values: ["info@example.com"],
        },
        {
          // disable eslint because we want to test falsy method
          method: hostileContactMethod(null),
          label: "Another Invalid",
          values: ["also-invalid"],
        },
      ]
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        ["telephone", "email", "website"]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]?.method).toBe("telephone")
      expect(result[1]?.method).toBe("email")
    })

    it("should return methods with at least one non-empty value", () => {
      // Arrange
      const methods: ContactInformationUIProps["methods"] = [
        {
          label: "Phone",
          method: "telephone",
          values: ["            ", "", "hello"],
        },
      ]
      const whitelistedMethods: ContactInformationUIProps["whitelistedMethods"] =
        ["telephone"]

      // Act
      const result = filterContactMethods({ methods, whitelistedMethods })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.values).toEqual(["hello"])
    })

    // Additional tests for invalid or empty values since data can be from external sources
    it("should filter out methods with invalid or empty values", () => {
      // Arrange
      const methods: ContactInformationUIProps["methods"] = [
        {
          label: "Phone",
          method: "telephone",
          values: ["+65-1234-5678"],
        },
        {
          label: "Phone with whitespace",
          method: "telephone",
          values: ["   "],
        },
        {
          label: "Phone with empty string",
          method: "telephone",
          values: [""],
        },
        {
          label: "Phone with empty array",
          method: "telephone",
          values: [],
        },
        {
          label: "Phone with undefined",
          method: "telephone",
          values: hostileContactValues(),
        },
        {
          label: "Phone with null",
          method: "telephone",
          values: hostileContactValues(null),
        },
        {
          label: "Phone with boolean",
          method: "telephone",
          values: [hostileContactValue()],
        },
        {
          label: "Phone with object",
          method: "telephone",
          values: hostileContactValues([{}]),
        },
        {
          label: "Phone with boolean",
          method: "telephone",
          values: [hostileContactValue(true)],
        },
        {
          label: "Phone with nested array",
          method: "telephone",
          values: [hostileContactValue(["+65-1234-5678"])],
        },
      ]

      // Act
      const result = filterContactMethods({ methods })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.values).toEqual(["+65-1234-5678"])
    })
  })
})
