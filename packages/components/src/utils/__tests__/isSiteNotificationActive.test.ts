import { describe, expect, it } from "vitest"

import { isSiteNotificationActive } from "../isSiteNotificationActive"

describe("isSiteNotificationActive", () => {
  it("returns false when notification is undefined", () => {
    expect(isSiteNotificationActive(undefined)).toBe(false)
  })

  describe("when type is omitted (backward compatibility)", () => {
    it("returns true when title is non-empty", () => {
      // Arrange
      const notification = { title: "Maintenance" }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(true)
    })

    it("returns false when title is empty", () => {
      // Arrange
      const notification = { title: "" }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('when type is "custom"', () => {
    it("returns true when title is non-empty", () => {
      // Arrange
      const notification = { type: "custom" as const, title: "Notice" }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(true)
    })

    it("returns false when title is empty", () => {
      // Arrange
      const notification = { type: "custom" as const, title: "" }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('when type is "antiscam"', () => {
    it("returns true", () => {
      // Arrange
      const notification = {
        type: "antiscam" as const,
      }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(true)
    })
  })
})
