import { describe, expect, it } from "vitest"

import {
  canPublishNotificationSettings,
  normalizeSiteNotification,
  shouldClearFormBuilderErrorsOnBannerDisable,
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

describe("canPublishNotificationSettings", () => {
  it("returns false when there are no unsaved changes", () => {
    expect(canPublishNotificationSettings(false, { title: "Hi" })).toBe(false)
  })

  it("allows publishing when the banner is turned off", () => {
    expect(canPublishNotificationSettings(true, undefined)).toBe(true)
  })

  it("blocks publishing an active banner without a custom title", () => {
    expect(canPublishNotificationSettings(true, { title: "" })).toBe(false)
  })

  it("allows publishing a valid custom notification", () => {
    expect(canPublishNotificationSettings(true, { title: "Notice" })).toBe(true)
  })

  it("allows publishing an anti-scam notification", () => {
    expect(canPublishNotificationSettings(true, { type: "antiscam" })).toBe(
      true,
    )
  })
})

describe("shouldClearFormBuilderErrorsOnBannerDisable", () => {
  it("returns true when disabling an enabled banner", () => {
    expect(shouldClearFormBuilderErrorsOnBannerDisable(true)).toBe(true)
  })

  it("returns false when enabling the banner", () => {
    expect(shouldClearFormBuilderErrorsOnBannerDisable(false)).toBe(false)
  })
})
