import { describe, expect, it } from "vitest"

import type { isUserOnboardedProps } from "../isUserOnboarded"
import { isUserOnboarded } from "../isUserOnboarded"

describe("isUserOnboarded", () => {
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

  it("should return false for invalid Singapore phone numbers", () => {
    // Arrange
    const usersWithInvalidPhone = [
      { name: "John Doe", phone: "1234567" }, // Too short
      { name: "Jane Smith", phone: "123456789" }, // Too long
      { name: "Bob Lee", phone: "51234567" }, // Invalid starting digit
      { name: "Alice Wong", phone: "9123456a" }, // Contains non-numeric
      { name: "Charlie Tan", phone: "+6591234567" }, // Contains country code
      { name: "David Lim", phone: "9123 4567" }, // Contains space
    ]

    // Act & Assert
    usersWithInvalidPhone.forEach((user) => {
      expect(isUserOnboarded(user)).toBe(false)
    })
  })
})
