import { describe, expect, it } from "vitest"

import {
  canPublishNotificationSettings,
  normalizeSiteNotification,
  resolveNotificationFormBuilderChange,
} from "../notificationSettings.utils"

describe("normalizeSiteNotification", () => {
  it("strips custom fields when type is antiscam", () => {
    // Arrange
    const notification = {
      type: "antiscam" as const,
      title: "Old title",
      content: [{ type: "text" as const, text: "stale" }],
    }

    // Act
    const result = normalizeSiteNotification(notification)

    // Assert
    expect(result).toEqual({ type: "antiscam" })
  })

  it("leaves custom notifications unchanged", () => {
    // Arrange
    const notification = {
      type: "custom" as const,
      title: "Notice",
    }

    // Act
    const result = normalizeSiteNotification(notification)

    // Assert
    expect(result).toEqual(notification)
  })
})

describe("resolveNotificationFormBuilderChange", () => {
  it("returns undefined when form builder changes are disabled", () => {
    // Arrange
    const notification = { type: "antiscam" as const }

    // Act
    const result = resolveNotificationFormBuilderChange(false, notification)

    // Assert
    expect(result).toBeUndefined()
  })

  it("normalizes notification when form builder changes are enabled", () => {
    // Arrange
    const notification = {
      type: "antiscam" as const,
      title: "stale",
    }

    // Act
    const result = resolveNotificationFormBuilderChange(true, notification)

    // Assert
    expect(result).toEqual({ type: "antiscam" })
  })
})

describe("canPublishNotificationSettings", () => {
  it("returns false when there are no unsaved changes", () => {
    // Arrange
    const isDirty = false
    const notification = { title: "Hi" }

    // Act
    const result = canPublishNotificationSettings(isDirty, notification)

    // Assert
    expect(result).toBe(false)
  })

  it("allows publishing when the banner is turned off", () => {
    // Arrange
    const isDirty = true
    const notification = undefined

    // Act
    const result = canPublishNotificationSettings(isDirty, notification)

    // Assert
    expect(result).toBe(true)
  })

  it("blocks publishing an active banner without a custom title", () => {
    // Arrange
    const isDirty = true
    const notification = { title: "" }

    // Act
    const result = canPublishNotificationSettings(isDirty, notification)

    // Assert
    expect(result).toBe(false)
  })

  it("allows publishing a valid custom notification", () => {
    // Arrange
    const isDirty = true
    const notification = { title: "Notice" }

    // Act
    const result = canPublishNotificationSettings(isDirty, notification)

    // Assert
    expect(result).toBe(true)
  })

  it("allows publishing an anti-scam notification", () => {
    // Arrange
    const isDirty = true
    const notification = { type: "antiscam" as const }

    // Act
    const result = canPublishNotificationSettings(isDirty, notification)

    // Assert
    expect(result).toBe(true)
  })
})
