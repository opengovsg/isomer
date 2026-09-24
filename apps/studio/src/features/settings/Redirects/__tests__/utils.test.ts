import type { ResolvedDestination } from "../utils"
import {
  formatAddedAt,
  getDestinationDisplay,
  isReferenceDestination,
  shouldWarnDestination,
} from "../utils"

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

describe("isReferenceDestination", () => {
  it("returns true only for a string that is exactly a reference", () => {
    expect(isReferenceDestination("[resource:1:2]")).toBe(true)
  })

  it("returns false for literal paths and external URLs", () => {
    expect(isReferenceDestination("/about-us")).toBe(false)
    expect(isReferenceDestination("https://example.gov.sg/page")).toBe(false)
  })

  it("returns false for a value that merely contains the reference substring", () => {
    // The shared regex is unanchored; isReferenceDestination must not match a
    // reference embedded in an external URL or a longer string.
    expect(
      isReferenceDestination("https://example.gov.sg/[resource:1:2]"),
    ).toBe(false)
    expect(isReferenceDestination("[resource:1:2]/extra")).toBe(false)
  })
})

describe("getDestinationDisplay", () => {
  it("shows a non-reference destination verbatim", () => {
    expect(getDestinationDisplay("/about-us", new Map())).toEqual({
      status: "resolved",
      label: "/about-us",
    })
  })

  it("is resolving until the reference lookup lands", () => {
    expect(getDestinationDisplay("[resource:1:2]", new Map())).toEqual({
      status: "resolving",
    })
  })

  it("resolves a reference to the page's current permalink", () => {
    const infoByDestination = new Map<string, ResolvedDestination>([
      ["[resource:1:2]", { permalink: "/about/contact", warn: false }],
    ])
    expect(getDestinationDisplay("[resource:1:2]", infoByDestination)).toEqual({
      status: "resolved",
      label: "/about/contact",
    })
  })

  it("flags a reference whose page no longer exists as missing", () => {
    const infoByDestination = new Map<string, ResolvedDestination>([
      ["[resource:1:2]", { permalink: null, warn: true }],
    ])
    expect(getDestinationDisplay("[resource:1:2]", infoByDestination)).toEqual({
      status: "missing",
    })
  })
})

describe("shouldWarnDestination", () => {
  it("warns when the server flagged the destination as leading nowhere", () => {
    const infoByDestination = new Map<string, ResolvedDestination>([
      ["[resource:1:2]", { permalink: null, warn: true }],
      ["/unpublished", { permalink: null, warn: true }],
    ])
    expect(shouldWarnDestination("[resource:1:2]", infoByDestination)).toBe(
      true,
    )
    expect(shouldWarnDestination("/unpublished", infoByDestination)).toBe(true)
  })

  it("does not warn for a published destination", () => {
    const infoByDestination = new Map<string, ResolvedDestination>([
      ["[resource:1:2]", { permalink: "/about/contact", warn: false }],
    ])
    expect(shouldWarnDestination("[resource:1:2]", infoByDestination)).toBe(
      false,
    )
  })

  it("does not warn for a destination that is still resolving or external", () => {
    expect(shouldWarnDestination("https://example.gov.sg", new Map())).toBe(
      false,
    )
    expect(shouldWarnDestination("[resource:1:2]", new Map())).toBe(false)
  })
})
