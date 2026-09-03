"use client"

import type { CalendarDate } from "@internationalized/date"
import type { RangeCalendarState } from "@react-stately/calendar"
import { getWeeksInMonth } from "@internationalized/date"
import { useCalendarGrid } from "@react-aria/calendar"
import { useMemo, useState } from "react"

import { CalendarCell } from "./CalendarCell"

interface CalendarGridProps {
  state: RangeCalendarState
}

// Plain flex rows rather than a <table> — avoids browser table-rendering
// quirks (hairline seams between adjacent <td> backgrounds) and lets range
// "fill" segments have a real gap between weeks. ARIA row/grid semantics are
// reproduced by hand via `role` since we're not using table elements.
export const CalendarGrid = ({ state }: CalendarGridProps) => {
  const { gridProps, headerProps, weekDays } = useCalendarGrid({}, state)
  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, "en-SG")

  // Hovering an adjacent-month day previews the range like any other cell,
  // but tracked separately from react-aria's own `highlightDate` — that
  // moves `focusedDate`, which auto-pages the calendar to keep focus
  // visible, jumping the whole view to the hovered month. This mirrors the
  // preview without touching `focusedDate`.
  const [hoveredOutsideDate, setHoveredOutsideDate] =
    useState<CalendarDate | null>(null)
  const highlightedRange = useMemo(() => {
    if (state.anchorDate && hoveredOutsideDate) {
      return hoveredOutsideDate.compare(state.anchorDate) < 0
        ? { start: hoveredOutsideDate, end: state.anchorDate }
        : { start: state.anchorDate, end: hoveredOutsideDate }
    }
    return state.highlightedRange
  }, [state.anchorDate, state.highlightedRange, hoveredOutsideDate])

  return (
    <div {...gridProps}>
      <div {...headerProps} role="row" className="flex">
        {weekDays.map((day, index) => (
          <div
            key={index}
            role="columnheader"
            className="prose-label-md-medium flex h-11 w-11 items-center justify-center text-base-content max-[374px]:h-9 max-[374px]:w-9"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-y-1">
        {[...Array(weeksInMonth).keys()].map((weekIndex) => (
          <div key={weekIndex} role="row" className="flex">
            {state
              .getDatesInWeek(weekIndex)
              .map((date, index) =>
                date ? (
                  <CalendarCell
                    key={index}
                    state={state}
                    date={date}
                    highlightedRange={highlightedRange}
                    onHoverOutsideDate={setHoveredOutsideDate}
                  />
                ) : (
                  <div
                    key={index}
                    role="gridcell"
                    className="h-11 w-11 max-[374px]:h-9 max-[374px]:w-9"
                  />
                ),
              )}
          </div>
        ))}
      </div>
    </div>
  )
}
