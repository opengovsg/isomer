import { describe, expect, it } from "vitest"

import type { isUserOnboardedProps } from "../isUserOnboarded"
import { isUserOnboarded } from "../isUserOnboarded"

describe("isUserOnboarded", () => {
  describe("user validation", () => {
    it("should return true for valid user with name and Singapore phone number", () => {
      // Arrange
      const validUsers = [
        { name: "John Doe", phone: "91234567" },
        { name: "Jane Smith", phone: "81234567" },
        { name: "Bob Lee", phone: "61234567" },
      ]

      // Act & Assert
      validUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(true)
      })
    })

    it("should return false when name is missing", () => {
      // Arrange
      const usersWithoutName = [
        { name: "", phone: "91234567" },
        { name: undefined, phone: "81234567" },
        { name: null, phone: "61234567" },
      ]

      // Act & Assert
      usersWithoutName.forEach((user) => {
        expect(isUserOnboarded(user as isUserOnboardedProps)).toBe(false)
      })
    })

    it("should return false when phone is missing", () => {
      // Arrange
      const usersWithoutPhone = [
        { name: "John Doe", phone: "" },
        { name: "Jane Smith", phone: undefined },
        { name: "Bob Lee", phone: null },
      ]

      // Act & Assert
      usersWithoutPhone.forEach((user) => {
        expect(isUserOnboarded(user as isUserOnboardedProps)).toBe(false)
      })
    })
  })

  describe("phone number validation", () => {
    it("should return true for valid Singapore phone numbers starting with 6, 8, or 9", () => {
      // Arrange
      const validUsers = [
        { name: "Test User", phone: "61234567" }, // Starting with 6
        { name: "Test User", phone: "81234567" }, // Starting with 8
        { name: "Test User", phone: "91234567" }, // Starting with 9
        { name: "Test User", phone: "69999999" },
        { name: "Test User", phone: "89999999" },
        { name: "Test User", phone: "99999999" },
      ]

      // Act & Assert
      validUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(true)
      })
    })

    it("should return false for numbers not starting with 6, 8, or 9", () => {
      // Arrange
      const invalidUsers = [
        { name: "Test User", phone: "11234567" },
        { name: "Test User", phone: "21234567" },
        { name: "Test User", phone: "31234567" },
        { name: "Test User", phone: "41234567" },
        { name: "Test User", phone: "51234567" },
        { name: "Test User", phone: "71234567" },
      ]

      // Act & Assert
      invalidUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(false)
      })
    })

    it("should return false for numbers with incorrect length", () => {
      // Arrange
      const invalidUsers = [
        { name: "Test User", phone: "912345" }, // Too short (6 digits)
        { name: "Test User", phone: "9123456" }, // Too short (7 digits)
        { name: "Test User", phone: "912345678" }, // Too long (9 digits)
        { name: "Test User", phone: "9123456789" }, // Too long (10 digits)
      ]

      // Act & Assert
      invalidUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(false)
      })
    })

    it("should return false for non-numeric inputs", () => {
      // Arrange
      const invalidUsers = [
        { name: "Test User", phone: "abcdefgh" }, // Letters
        { name: "Test User", phone: "9123456a" }, // Mix of numbers and letters
        { name: "Test User", phone: "91234-67" }, // With hyphen
        { name: "Test User", phone: "9123 456" }, // With space
        { name: "Test User", phone: "+6591234567" }, // With country code
      ]

      // Act & Assert
      invalidUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(false)
      })
    })

    it("should return false for empty or invalid inputs", () => {
      // Arrange
      const invalidUsers = [
        { name: "Test User", phone: "" }, // Empty string
        { name: "Test User", phone: " " }, // Space
        { name: "Test User", phone: "null" }, // String "null"
        { name: "Test User", phone: "undefined" }, // String "undefined"
      ]

      // Act & Assert
      invalidUsers.forEach((user) => {
        expect(isUserOnboarded(user)).toBe(false)
      })
    })
  })
})
