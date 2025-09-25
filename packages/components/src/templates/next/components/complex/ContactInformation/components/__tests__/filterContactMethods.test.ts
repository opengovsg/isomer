import { describe, expect, it } from "vitest"

import type {
  CONTACT_INFORMATION_SUPPORT_METHODS,
  ContactInformationUIProps,
} from "~/interfaces"
import { filterContactMethods } from "../filterContactMethods"

// Helper function to create mock contact methods
const createMockMethods = (
  methodTypes: (typeof CONTACT_INFORMATION_SUPPORT_METHODS)[number][],
): ContactInformationUIProps["methods"] => {
  return methodTypes.map((method, index) => ({
    method,
    label: `${method} label ${index + 1}`,
    values: [`${method} value ${index + 1}`],
    caption: `${method} caption ${index + 1}`,
  }))
}

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
          method: "telephone",
          label: "Main Phone",
          values: ["+65-1234-5678"],
          caption: "Main office",
        },
        {
          method: "email",
          label: "General Email",
          values: ["info@example.com"],
          caption: "General inquiries",
        },
        {
          method: "telephone",
          label: "Emergency Phone",
          values: ["+65-9876-5432"],
          caption: "Emergency only",
        },
        {
          method: "website",
          label: "Main Website",
          values: ["https://example.com"],
          caption: "Official website",
        },
        {
          method: "email",
          label: "Support Email",
          values: ["support@example.com"],
          caption: "Technical support",
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
          method: "telephone",
          label: "Phone",
          values: ["+65-1234-5678"],
        },
        {
          method: undefined, // Falsy method
          label: "Invalid Method",
          values: ["invalid"],
        },
        {
          method: "email",
          label: "Email",
          values: ["info@example.com"],
        },
        {
          // disable eslint because we want to test falsy method
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          method: null as any, // Falsy method
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
  })
})
