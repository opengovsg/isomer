import { describe, expect, it } from "vitest"

import { isSingaporePhoneNumber } from "../phone"

describe("isSingaporePhoneNumber", () => {
  it("should return true for valid Singapore phone numbers starting with 6", () => {
    // Arrange
    const validNumbersStartingWith6 = ["61234567", "69999999"]

    // Act & Assert
    validNumbersStartingWith6.forEach((number) => {
      expect(isSingaporePhoneNumber(number)).toBe(true)
    })
  })

  it("should return true for valid Singapore phone numbers starting with 8", () => {
    // Arrange
    const validNumbersStartingWith8 = ["81234567", "89999999"]

    // Act & Assert
    validNumbersStartingWith8.forEach((number) => {
      expect(isSingaporePhoneNumber(number)).toBe(true)
    })
  })

  it("should return true for valid Singapore phone numbers starting with 9", () => {
    // Arrange
    const validNumbersStartingWith9 = ["91234567", "99999999"]

    // Act & Assert
    validNumbersStartingWith9.forEach((number) => {
      expect(isSingaporePhoneNumber(number)).toBe(true)
    })
  })

  it("should return false for numbers not starting with 6, 8, or 9", () => {
    // Arrange
    const invalidStartingDigits = [
      "11234567",
      "21234567",
      "31234567",
      "41234567",
      "51234567",
      "71234567",
    ]

    // Act & Assert
    invalidStartingDigits.forEach((number) => {
      expect(isSingaporePhoneNumber(number)).toBe(false)
    })
  })

  it("should return false for numbers with incorrect length", () => {
    // Arrange
    const numbersWithIncorrectLength = [
      "912345", // Too short (6 digits)
      "9123456", // Too short (7 digits)
      "912345678", // Too long (9 digits)
      "9123456789", // Too long (10 digits)
    ]

    // Act & Assert
    numbersWithIncorrectLength.forEach((number) => {
      expect(isSingaporePhoneNumber(number)).toBe(false)
    })
  })

  it("should return false for non-numeric inputs", () => {
    // Arrange
    const nonNumericInputs = [
      "abcdefgh", // Letters
      "9123456a", // Mix of numbers and letters
      "91234-67", // With hyphen
      "9123 456", // With space
      "+6591234567", // With country code
    ]

    // Act & Assert
    nonNumericInputs.forEach((input) => {
      expect(isSingaporePhoneNumber(input)).toBe(false)
    })
  })

  it("should return false for empty or invalid inputs", () => {
    // Arrange
    const emptyOrInvalidInputs = [
      "", // Empty string
      " ", // Space
      "null", // String "null"
      "undefined", // String "undefined"
    ]

    // Act & Assert
    emptyOrInvalidInputs.forEach((input) => {
      expect(isSingaporePhoneNumber(input)).toBe(false)
    })
  })
})
