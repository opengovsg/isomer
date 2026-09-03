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

const getDateInput = () => screen.getByLabelText("DD/MM/YYYY")

describe("DateRangeFilterInput", () => {
  it("opens the calendar, stages a selection, and only calls onChange on Apply", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    // Act
    openCalendar()
    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("20"))

    // Assert
    expect(onChange).not.toHaveBeenCalled()

    // Act
    fireEvent.click(screen.getByText("Apply"))

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: currentMonthIso(10),
      end: currentMonthIso(20),
    })
    expect(screen.queryByText("Apply")).toBeNull()
  })

  it("applies a single click as a one-day range, not a no-op", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    // Act
    openCalendar()
    fireEvent.click(screen.getByText("10"))
    fireEvent.click(screen.getByText("Apply"))

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: currentMonthIso(10),
      end: currentMonthIso(10),
    })
  })

  it("applies today's date when Apply is pressed without changing the default selection", () => {
    // Arrange
    const onChange = vi.fn()
    const today = getSingaporeDateYYYYMMDD()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    // Act
    openCalendar()
    fireEvent.click(screen.getByText("Apply"))

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: today,
      end: today,
    })
  })

  it("shows a single date, not a range, when start and end are the same day", () => {
    // Arrange
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(13), end: currentMonthIso(13) }}
        onChange={vi.fn()}
      />,
    )

    // Act / Assert
    const [year, month, day] = currentMonthIso(13).split("-")
    screen.getByDisplayValue(`${day}/${month}/${year}`)
    expect(screen.queryByDisplayValue(/ - /)).toBeNull()
  })

  it("closes the calendar without calling onChange when clicking outside", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)
    openCalendar()
    screen.getByText("Apply")

    // Act
    fireEvent.mouseDown(document.body)

    // Assert
    expect(screen.queryByText("Apply")).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows the applied range and re-opens the calendar with it staged", () => {
    // Arrange
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(5), end: currentMonthIso(8) }}
        onChange={vi.fn()}
      />,
    )

    const start = currentMonthIso(5).split("-")
    const end = currentMonthIso(8).split("-")
    const displayValue = `${start[2]}/${start[1]}/${start[0]} - ${end[2]}/${end[1]}/${end[0]}`

    // Act / Assert
    screen.getByDisplayValue(displayValue)
  })

  it("clears the applied range when Clear is pressed", () => {
    // Arrange
    const onChange = vi.fn()
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(5), end: currentMonthIso(8) }}
        onChange={onChange}
      />,
    )

    // Act
    openCalendar()
    fireEvent.click(screen.getByText("Clear"))

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(screen.queryByText("Clear")).toBeNull()
  })

  it("shows an inline error for invalid typed dates", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    // Act
    fireEvent.change(getDateInput(), {
      target: { value: "31/02/2026" },
    })
    fireEvent.blur(getDateInput())

    // Assert
    screen.getByText("Enter a valid date in DD/MM/YYYY format")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("commits a valid typed single date on blur", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)

    // Act
    fireEvent.change(getDateInput(), {
      target: { value: "10/06/2026" },
    })
    fireEvent.blur(getDateInput())

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: "2026-06-10",
      end: "2026-06-10",
    })
  })

  it("auto-formats digits as the user types", () => {
    // Arrange
    const onChange = vi.fn()
    render(<DateRangeFilterInput value={undefined} onChange={onChange} />)
    const input = getDateInput()

    // Act
    fireEvent.change(input, {
      target: { value: "09031996", selectionStart: 8 },
    })

    // Assert
    expect(input).toHaveValue("09/03/1996")
  })

  it("blocks alphabetic characters from being entered", () => {
    // Arrange
    render(<DateRangeFilterInput value={undefined} onChange={vi.fn()} />)
    const input = getDateInput()

    // Act
    fireEvent.keyDown(input, { key: "a" })
    fireEvent.change(input, {
      target: { value: "09a03", selectionStart: 4 },
    })

    // Assert
    expect(input).toHaveValue("09/03")
  })

  it("focuses today's date when the calendar is opened with the keyboard", () => {
    // Arrange
    const today = getSingaporeDateYYYYMMDD()
    const todayDay = String(Number(today.split("-")[2]))
    render(<DateRangeFilterInput value={undefined} onChange={vi.fn()} />)
    const trigger = screen.getByLabelText("Open calendar")

    // Act
    trigger.focus()
    fireEvent.keyDown(trigger, { key: "Enter" })
    fireEvent.click(trigger)

    // Assert
    expect(document.activeElement).toHaveTextContent(todayDay)
    expect(document.activeElement).toHaveAttribute("tabindex", "0")
    expect(screen.getByLabelText(/^previous$/i)).not.toHaveFocus()
  })

  it("focuses the applied start date when the calendar is re-opened", () => {
    // Arrange
    render(
      <DateRangeFilterInput
        value={{ start: currentMonthIso(13), end: currentMonthIso(20) }}
        onChange={vi.fn()}
      />,
    )

    // Act
    openCalendar()

    // Assert
    expect(document.activeElement).toHaveTextContent("13")
    expect(document.activeElement).toHaveAttribute("tabindex", "0")
  })

  it("shows a ghost placeholder suffix while focused and incomplete", () => {
    // Arrange
    render(<DateRangeFilterInput value={undefined} onChange={vi.fn()} />)
    const input = getDateInput()

    // Act
    fireEvent.focus(input)
    fireEvent.change(input, {
      target: { value: "09", selectionStart: 2 },
    })

    // Assert
    expect(screen.getByText("/MM/YYYY")).toBeTruthy()
  })
})
