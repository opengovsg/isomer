import { addDays, addHours } from "date-fns"
import MockDate from "mockdate"

import { getEarliestAllowableTime } from "../utils"

describe("ScheduledPublishingModal.utils", () => {
  describe("getEarliestAllowableTime", () => {
    const FIXED_NOW = new Date("2024-01-01T00:15:00.000Z")
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
    })
    it("should return the correct earliest allowable time for same day", () => {
      // Arrange
      // Both selected date and earliest schedule are on the same day
      const hoursToAdd = 10 // 10 hours later
      const earliestSchedule = addHours(FIXED_NOW, hoursToAdd) // 10:00 AM UTC
      const selectedDate = FIXED_NOW // same day

      // Act
      const actual = getEarliestAllowableTime(selectedDate, earliestSchedule)

      // Assert
      expect(actual).toEqual({
        hours: FIXED_NOW.getHours() + hoursToAdd,
        minutes: FIXED_NOW.getMinutes(),
      })
    })
    it("should return null for different days", () => {
      // Arrange
      // Both selected date and earliest schedule are on different days
      const earliestScheduleDay = addDays(FIXED_NOW, 1) // next day
      const hoursToAdd = 10 // 10 hours later
      const earliestSchedule = addHours(earliestScheduleDay, hoursToAdd) // 10:00 AM

      // Act
      const actual = getEarliestAllowableTime(FIXED_NOW, earliestSchedule)

      // Assert
      expect(actual).toBeNull()
    })
  })
})
