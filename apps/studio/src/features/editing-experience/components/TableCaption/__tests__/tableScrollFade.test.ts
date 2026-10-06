import { describe, expect, it } from "vitest"

import {
  scrollFadeEdges,
  tableScrollFadeLabel,
  tableScrollFadeMask,
} from "../tableScrollFade"

describe("scrollFadeEdges", () => {
  it("fades only the trailing edge at the start of an overflowing table", () => {
    // Arrange / Act
    const edges = scrollFadeEdges({
      scrollLeft: 0,
      scrollWidth: 800,
      clientWidth: 320,
    })

    // Assert
    expect(edges).toEqual({ start: false, end: true })
    expect(tableScrollFadeLabel(edges)).toBe("end")
    expect(tableScrollFadeMask(edges)).toContain("linear-gradient")
  })

  it("fades both edges while columns are hidden on either side", () => {
    // Arrange / Act
    const edges = scrollFadeEdges({
      scrollLeft: 40,
      scrollWidth: 800,
      clientWidth: 320,
    })

    // Assert
    expect(edges).toEqual({ start: true, end: true })
    expect(tableScrollFadeLabel(edges)).toBe("both")
  })

  it("fades only the leading edge when scrolled to the end", () => {
    // Arrange / Act
    const edges = scrollFadeEdges({
      scrollLeft: 480,
      scrollWidth: 800,
      clientWidth: 320,
    })

    // Assert
    expect(edges).toEqual({ start: true, end: false })
    expect(tableScrollFadeLabel(edges)).toBe("start")
  })

  it("shows no fade when the table fits", () => {
    // Arrange / Act
    const edges = scrollFadeEdges({
      scrollLeft: 0,
      scrollWidth: 320,
      clientWidth: 320,
    })

    // Assert
    expect(edges).toEqual({ start: false, end: false })
    expect(tableScrollFadeLabel(edges)).toBeUndefined()
    expect(tableScrollFadeMask(edges)).toBeUndefined()
  })

  it("ignores a hairline overflow", () => {
    // Arrange / Act
    const edges = scrollFadeEdges({
      scrollLeft: 0,
      scrollWidth: 324,
      clientWidth: 320,
    })

    // Assert
    expect(edges).toEqual({ start: false, end: false })
  })
})
