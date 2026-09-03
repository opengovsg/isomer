import { CalendarDate } from "@internationalized/date"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { RangeCalendar } from "../RangeCalendar/RangeCalendar"

// April 2026 is fixed (rather than "today") so the visible month's leading
// and trailing outside-of-month cells are known in advance: April 1 falls
// on a Wednesday and April 30 on a Thursday, so the grid pads with Mar
// 29-31 (leading) and May 1-2 (trailing) — both needed to test cross-month
// cell selection deterministically.
const APRIL_15_2026 = new CalendarDate(2026, 4, 15)

const findOutsideRangeCellByDay = (day: string): HTMLElement => {
  const cell = Array.from(
    document.querySelectorAll(".text-base-content-light"),
  ).find((el) => el.textContent === day)
  if (!cell) {
    throw new Error(`Could not find an outside-range cell for day ${day}`)
  }
  return cell as HTMLElement
}

describe("RangeCalendar", () => {
  it("orders the range correctly when the later date is clicked before the earlier date", () => {
    // Arrange
    const onApply = vi.fn()
    render(
      <RangeCalendar
        defaultValue={{ start: APRIL_15_2026, end: APRIL_15_2026 }}
        onApply={onApply}
      />,
    )

    // Act
    fireEvent.click(screen.getByText("20"))
    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("Apply"))

    // Assert
    expect(onApply).toHaveBeenCalledExactlyOnceWith({
      start: new CalendarDate(2026, 4, 10),
      end: new CalendarDate(2026, 4, 20),
    })
  })

  it("resolves a range spanning two months when a trailing outside-range cell is clicked", () => {
    // Arrange
    const onApply = vi.fn()
    render(
      <RangeCalendar
        defaultValue={{ start: APRIL_15_2026, end: APRIL_15_2026 }}
        onApply={onApply}
      />,
    )

    // Act
    fireEvent.click(screen.getByText("15"))
    fireEvent.click(findOutsideRangeCellByDay("1"))
    fireEvent.click(screen.getByText("Apply"))

    // Assert
    expect(onApply).toHaveBeenCalledExactlyOnceWith({
      start: new CalendarDate(2026, 4, 15),
      end: new CalendarDate(2026, 5, 1),
    })
  })
})
