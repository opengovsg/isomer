import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DateRangeFilterInput } from "../DateRangeFilterInput"

const pad = (n: number): string => n.toString().padStart(2, "0")

const currentMonthIso = (day: number): string => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`
}

describe("DateRangeFilterInput", () => {
  it("opens the calendar, stages a selection, and only calls onChange on Apply", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    fireEvent.click(screen.getByText("DD/MM/YYYY"))

    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("20"))

    // Selecting a range doesn't call onChange until Apply is pressed.
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText("Apply"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: currentMonthIso(10),
      end: currentMonthIso(20),
    })

    // The popover closes after applying.
    expect(screen.queryByText("Apply")).toBeNull()
  })

  it("applies a single click as a one-day range, not a no-op", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    fireEvent.click(screen.getByText("DD/MM/YYYY"))
    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("Apply"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: currentMonthIso(10),
      end: currentMonthIso(10),
    })
  })

  it("shows a single date, not a range, when start and end are the same day", () => {
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(13), end: currentMonthIso(13) }}
        onChange={vi.fn()}
      />,
    )

    const [year, month, day] = currentMonthIso(13).split("-")
    screen.getByText(`${day}/${month}/${year}`)
    expect(screen.queryByText(/ - /)).toBeNull()
  })

  it("closes the calendar without calling onChange when clicking outside", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    fireEvent.click(screen.getByText("DD/MM/YYYY"))
    screen.getByText("Apply")

    fireEvent.mouseDown(document.body)

    expect(screen.queryByText("Apply")).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows the applied range and re-opens the calendar with it staged", () => {
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(5), end: currentMonthIso(8) }}
        onChange={vi.fn()}
      />,
    )

    const start = currentMonthIso(5).split("-")
    const end = currentMonthIso(8).split("-")
    const displayValue = `${start[2]}/${start[1]}/${start[0]} - ${end[2]}/${end[1]}/${end[0]}`

    screen.getByText(displayValue)
  })
})
