import { describe, expect, it } from "vitest"

import { isSiteNotificationActive } from "../isSiteNotificationActive"

describe("isSiteNotificationActive", () => {
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

  describe('when type is "gois"', () => {
    it("returns true when useGOISmessage is true", () => {
      // Arrange
      const notification = {
        type: "gois" as const,
        useGOISmessage: true,
      }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(true)
    })

    it("returns false when useGOISmessage is false", () => {
      // Arrange
      const notification = {
        type: "gois" as const,
        useGOISmessage: false,
      }

      // Act
      const result = isSiteNotificationActive(notification)

      // Assert
      expect(result).toBe(false)
    })
  })
})
