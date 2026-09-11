import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import type { AppliedFilter } from "../../../../types/Filter"
import { DateFilterControls } from "../DateFilterControls"

const getFromInput = () => screen.getByLabelText("From")
const getToInput = () => screen.getByLabelText("To")

const APPLIED_RANGE = { start: "2026-04-05", end: "2026-04-08" }

const StatefulDateFilterControls = ({
  initialDateRange,
  onDateRangeChange,
}: {
  initialDateRange: AppliedFilter["dateRange"]
  onDateRangeChange: (dateRange: AppliedFilter["dateRange"]) => void
}) => {
  const [dateRange, setDateRange] =
    useState<AppliedFilter["dateRange"]>(initialDateRange)

  return (
    <DateFilterControls
      items={[]}
      dateRange={dateRange}
      onDateRangeChange={(next) => {
        onDateRangeChange(next)
        setDateRange(next)
      }}
      showStatusLabelsFilter={false}
      showDateRangeFilter={true}
    />
  )
}

describe("DateFilterControls", () => {
  it("keeps the remaining date when one side of an applied range is cleared", () => {
    // Arrange
    const onDateRangeChange = vi.fn()
    render(
      <StatefulDateFilterControls
        initialDateRange={APPLIED_RANGE}
        onDateRangeChange={onDateRangeChange}
      />,
    )

    // Act
    fireEvent.change(getFromInput(), { target: { value: "" } })

    // Assert
    expect(onDateRangeChange).toHaveBeenCalledExactlyOnceWith({
      end: APPLIED_RANGE.end,
    })
    expect((getFromInput() as HTMLInputElement).value).toBe("")
    expect((getToInput() as HTMLInputElement).value).toBe(APPLIED_RANGE.end)
  })

  it("forwards a From-only range to the parent immediately", () => {
    // Arrange
    const onDateRangeChange = vi.fn()
    render(
      <DateFilterControls
        items={[]}
        dateRange={undefined}
        onDateRangeChange={onDateRangeChange}
        showStatusLabelsFilter={false}
        showDateRangeFilter={true}
      />,
    )

    // Act
    fireEvent.change(getFromInput(), { target: { value: "2026-04-05" } })

    // Assert
    expect(onDateRangeChange).toHaveBeenCalledExactlyOnceWith({
      start: "2026-04-05",
    })
  })

  it("applies the range again when the cleared side is filled", () => {
    // Arrange
    const onDateRangeChange = vi.fn()
    render(
      <StatefulDateFilterControls
        initialDateRange={APPLIED_RANGE}
        onDateRangeChange={onDateRangeChange}
      />,
    )

    // Act
    fireEvent.change(getFromInput(), { target: { value: "" } })
    fireEvent.change(getFromInput(), { target: { value: "2026-04-06" } })

    // Assert
    expect(onDateRangeChange).toHaveBeenLastCalledWith({
      start: "2026-04-06",
      end: APPLIED_RANGE.end,
    })
  })

  it("clears both fields when the applied range is cleared externally", () => {
    // Arrange
    const { rerender } = render(
      <DateFilterControls
        items={[]}
        dateRange={APPLIED_RANGE}
        onDateRangeChange={vi.fn()}
        showStatusLabelsFilter={false}
        showDateRangeFilter={true}
      />,
    )

    // Act
    rerender(
      <DateFilterControls
        items={[]}
        dateRange={undefined}
        onDateRangeChange={vi.fn()}
        showStatusLabelsFilter={false}
        showDateRangeFilter={true}
      />,
    )

    // Assert
    expect((getFromInput() as HTMLInputElement).value).toBe("")
    expect((getToInput() as HTMLInputElement).value).toBe("")
  })

  it("renders nothing when both filters are hidden", () => {
    // Arrange / Act
    const { container } = render(
      <DateFilterControls
        items={[{ id: "upcoming", label: "Upcoming", count: 3 }]}
        dateRange={undefined}
        onDateRangeChange={vi.fn()}
        showStatusLabelsFilter={false}
        showDateRangeFilter={false}
      />,
    )

    // Assert
    expect(container.firstChild).toBeNull()
  })
})
