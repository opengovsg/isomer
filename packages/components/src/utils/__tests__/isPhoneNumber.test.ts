import { describe, expect, it } from "vitest"

import { isPhoneNumber } from "../isPhoneNumber"

describe("isPhoneNumber", () => {
  describe("basic validation", () => {
    it("should return true for valid international phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "+44123456789",
        "+6591234567",
        "1234567890",
        "44123456789",
        "91234567",
      ]

      validPhones.forEach((phone) => {
        expect(isPhoneNumber(phone)).toBe(true)
      })
    })

    it("should return false for invalid phone numbers", () => {
      const invalidPhones = [
        "",
        " ",
        "abc",
        "123",
        "+",
        "++1234567890",
        "123456789012345678901234567890", // Too long
        "0123456789", // Starts with 0
      ]

      invalidPhones.forEach((phone) => {
        console.log(phone)
        expect(isPhoneNumber(phone)).toBe(false)
      })
    })

    // edge case related to runtime validation
    it("should return false for non-string inputs", () => {
      const invalidInputs = [null, undefined, 123, {}, [], true, false]

      invalidInputs.forEach((input) => {
        expect(isPhoneNumber(input as any)).toBe(false)
      })
    })
  })

  describe("whitespace handling", () => {
    it("should handle phone numbers with whitespace", () => {
      const phonesWithWhitespace = [
        " +1234567890 ",
        " +44 123 456 789 ",
        " +65 9123 4567 ",
        " 123 456 7890 ",
        " 44 123 456 789 ",
        " 9123 4567 ",
      ]

      phonesWithWhitespace.forEach((phone) => {
        expect(isPhoneNumber(phone)).toBe(true)
      })
    })

    it("should handle phone numbers with various whitespace characters", () => {
      const phonesWithWhitespace = [
        "\t+1234567890\t",
        "\n+44123456789\n",
        " +6591234567 ",
        "123\t456\t7890",
        "44\n123\n456\n789",
      ]

      phonesWithWhitespace.forEach((phone) => {
        expect(isPhoneNumber(phone)).toBe(true)
      })
    })

    it("should handle phone numbers with hyphens and other separators", () => {
      // The implementation now removes common phone number separators
      const phonesWithSeparators = [
        "+1-234-567-8900",
        "+44-123-456-789",
        "+65-9123-4567",
        "123-456-7890",
        "44-123-456-789",
        "9123-4567",
        "(123) 456-7890",
        "+1 (234) 567-8900",
        "123.456.7890",
        "+44.123.456.789",
      ]

      phonesWithSeparators.forEach((phone) => {
        expect(isPhoneNumber(phone)).toBe(true) // These should now pass as separators are removed
      })
    })
  })

  describe("edge cases", () => {
    it("should handle empty strings and whitespace-only strings", () => {
      const emptyInputs = ["", " ", "  ", "\t", "\n", "\t\n"]

      emptyInputs.forEach((input) => {
        expect(isPhoneNumber(input)).toBe(false)
      })
    })

    it("should handle very long strings", () => {
      const longString = "1".repeat(100)
      expect(isPhoneNumber(longString)).toBe(false)
    })
  })
})
