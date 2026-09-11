import type { ComponentProps } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DateRangeFilterInput } from "../DateRangeFilterInput"

const getFromInput = () => screen.getByLabelText("From")
const getToInput = () => screen.getByLabelText("To")

const renderDateRangeFilterInput = (
  props: ComponentProps<typeof DateRangeFilterInput>,
) => render(<DateRangeFilterInput {...props} />)

describe("DateRangeFilterInput", () => {
  it("names the fieldset with a visible legend for screen readers", () => {
    // Arrange / Act
    renderDateRangeFilterInput({ value: undefined, onChange: vi.fn() })

    // Assert
    screen.getByRole("group", { name: "Search by date or range" })
  })

  it("calls onChange with a closed range when both fields are set", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({ value: undefined, onChange })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "2026-04-05" } })
    fireEvent.change(getToInput(), { target: { value: "2026-04-08" } })

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-04-05",
      end: "2026-04-08",
    })
  })

  it("calls onChange with a From-only open-ended range", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({ value: undefined, onChange })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "2026-04-05" } })

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: "2026-04-05",
    })
  })

  it("calls onChange with a To-only open-ended range", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({ value: undefined, onChange })

    // Act
    fireEvent.change(getToInput(), { target: { value: "2026-04-08" } })

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      end: "2026-04-08",
    })
  })

  it("clears one field without clearing the other", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({
      value: { start: "2026-04-05", end: "2026-04-08" },
      onChange,
    })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "" } })

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      end: "2026-04-08",
    })
    expect((getFromInput() as HTMLInputElement).value).toBe("")
    expect((getToInput() as HTMLInputElement).value).toBe("2026-04-08")
  })

  it("calls onChange with undefined when both fields are cleared", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({
      value: { start: "2026-04-05", end: "2026-04-08" },
      onChange,
    })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "" } })
    fireEvent.change(getToInput(), { target: { value: "" } })

    // Assert
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it("shows a validation error and does not call onChange when From is after To", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({ value: undefined, onChange })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "2026-06-01" } })
    fireEvent.change(getToInput(), { target: { value: "2026-05-01" } })

    // Assert
    screen.getByText("From date must be before or equal to To date")
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      start: "2026-06-01",
    })
  })

  it("commits again after an invalid range is corrected", () => {
    // Arrange
    const onChange = vi.fn()
    renderDateRangeFilterInput({ value: undefined, onChange })

    // Act
    fireEvent.change(getFromInput(), { target: { value: "2026-06-01" } })
    fireEvent.change(getToInput(), { target: { value: "2026-05-01" } })
    fireEvent.change(getToInput(), { target: { value: "2026-06-30" } })

    // Assert
    expect(
      screen.queryByText("From date must be before or equal to To date"),
    ).toBeNull()
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-06-01",
      end: "2026-06-30",
    })
  })
})
