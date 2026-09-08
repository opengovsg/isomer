import { addMinutes, format, subMinutes } from "date-fns"
import { describe, expect, it } from "vitest"

import {
  MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  scheduleUnpublishClientSchema,
} from "../schedule"

const VALID_BASE = {
  pageId: 1,
  siteId: 1,
}

describe("scheduleUnpublishClientSchema", () => {
  it("should combine unpublishDate and unpublishTime into a single scheduledAt Date", () => {
    // Arrange — derive the time string from the future date itself so this
    // doesn't flake depending on the wall-clock time the test runs at.
    const unpublishDate = addMinutes(new Date(), 60)
    const unpublishTime = format(unpublishDate, "HH:mm")

    // Act
    const result = scheduleUnpublishClientSchema.parse({
      ...VALID_BASE,
      unpublishDate,
      unpublishTime,
    })

    // Assert
    expect(result.scheduledAt.getHours()).toBe(unpublishDate.getHours())
    expect(result.scheduledAt.getMinutes()).toBe(unpublishDate.getMinutes())
    expect(result.scheduledAt.getSeconds()).toBe(0)
    expect(result.scheduledAt.getMilliseconds()).toBe(0)
  })

  it("should reject an unpublishTime not in HH:mm format", () => {
    // Arrange / Act / Assert
    expect(() =>
      scheduleUnpublishClientSchema.parse({
        ...VALID_BASE,
        unpublishDate: addMinutes(new Date(), 60),
        unpublishTime: "2:30 PM",
      }),
    ).toThrow()
  })

  it("should reject a scheduledAt earlier than the minimum lead time, attaching the error to unpublishTime when the date is today", () => {
    // Arrange
    const now = new Date()
    const tooSoon = subMinutes(now, 1)

    // Act
    const result = scheduleUnpublishClientSchema.safeParse({
      ...VALID_BASE,
      unpublishDate: tooSoon,
      unpublishTime: format(tooSoon, "HH:mm"),
    })

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["unpublishTime"])
    }
  })

  it("should reject a scheduledAt on a past date, attaching the error to unpublishDate", () => {
    // Arrange
    const yesterday = subMinutes(new Date(), 60 * 24)

    // Act
    const result = scheduleUnpublishClientSchema.safeParse({
      ...VALID_BASE,
      unpublishDate: yesterday,
      unpublishTime: "23:59",
    })

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["unpublishDate"])
    }
  })

  it("should accept a scheduledAt at/after the minimum lead time", () => {
    // Arrange
    const validDate = addMinutes(
      new Date(),
      MINIMUM_SCHEDULE_LEAD_TIME_MINUTES + 5,
    )

    // Act
    const result = scheduleUnpublishClientSchema.safeParse({
      ...VALID_BASE,
      unpublishDate: validDate,
      unpublishTime: format(validDate, "HH:mm"),
    })

    // Assert
    expect(result.success).toBe(true)
  })
})
