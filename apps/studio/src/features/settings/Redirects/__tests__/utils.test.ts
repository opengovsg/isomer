import { formatAddedAt } from "../utils"

describe("formatAddedAt", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T12:00:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "just now" for dates less than 5 minutes ago', () => {
    // Arrange
    const date = new Date("2026-06-10T11:56:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("just now")
  })

  it('should return "today" for dates exactly 5 minutes ago', () => {
    // Arrange
    const date = new Date("2026-06-10T11:55:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("today")
  })

  it('should return "today" for earlier the same day', () => {
    // Arrange
    const date = new Date("2026-06-10T00:00:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("today")
  })

  it('should return "yesterday" for dates on the previous day', () => {
    // Arrange
    const date = new Date("2026-06-09T23:59:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("yesterday")
  })

  it('should prefer "just now" over "yesterday" when crossing midnight', () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-10T00:02:00"))
    const date = new Date("2026-06-09T23:58:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("just now")
  })

  it("should return a formatted date for anything older than yesterday", () => {
    // Arrange
    const date = new Date("2026-06-08T12:00:00")

    // Act / Assert
    expect(formatAddedAt(date)).toBe("8 Jun 2026")
  })
})
