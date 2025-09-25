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
  })
})
