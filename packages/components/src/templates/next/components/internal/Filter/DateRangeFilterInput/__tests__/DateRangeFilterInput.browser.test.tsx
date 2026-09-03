import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import { DateRangeFilterInput } from "../DateRangeFilterInput"

const pad = (n: number): string => n.toString().padStart(2, "0")

const currentMonthIso = (day: number): string => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`
}

const openCalendar = () => {
  fireEvent.click(screen.getByLabelText("Open calendar"))
}

describe("DateRangeFilterInput", () => {
  it("opens the calendar, stages a selection, and only calls onChange on Apply", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    openCalendar()

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

    openCalendar()
    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("Apply"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: currentMonthIso(10),
      end: currentMonthIso(10),
    })
  })

  it("applies today's date when Apply is pressed without changing the default selection", () => {
    const onChange = vi.fn()
    const today = getSingaporeDateYYYYMMDD()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    openCalendar()
    fireEvent.click(screen.getByText("Apply"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: today,
      end: today,
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
    screen.getByDisplayValue(`${day}/${month}/${year}`)
    expect(screen.queryByDisplayValue(/ - /)).toBeNull()
  })

  it("closes the calendar without calling onChange when clicking outside", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    openCalendar()
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

    screen.getByDisplayValue(displayValue)
  })

  it("clears the applied range when Clear is pressed", () => {
    const onChange = vi.fn()
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(5), end: currentMonthIso(8) }}
        onChange={onChange}
      />,
    )

    openCalendar()
    fireEvent.click(screen.getByText("Clear"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(screen.queryByText("Clear")).toBeNull()
  })

  it("shows an inline error for invalid typed dates", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText("DD/MM/YYYY"), {
      target: { value: "31/02/2026" },
    })
    fireEvent.blur(screen.getByPlaceholderText("DD/MM/YYYY"))

    screen.getByText("Enter a valid date in DD/MM/YYYY format")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("commits a valid typed single date on blur", () => {
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText("DD/MM/YYYY"), {
      target: { value: "10/06/2026" },
    })
    fireEvent.blur(screen.getByPlaceholderText("DD/MM/YYYY"))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: "2026-06-10",
      end: "2026-06-10",
    })
  })
})
