"use client"

import type { CalendarDate } from "@internationalized/date"
import type { RangeCalendarState } from "@react-stately/calendar"
import { getWeeksInMonth } from "@internationalized/date"
import { useCalendarGrid } from "@react-aria/calendar"
import { useMemo, useState } from "react"

import { CalendarCell } from "./CalendarCell"
import { dayCellSize } from "./dayCellSize"

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

  // Adjacent-month days preview the range on hover or keyboard focus, tracked
  // separately from react-aria's own `highlightDate` — that moves
  // `focusedDate`, which auto-pages the calendar to keep focus visible.
  const [previewOutsideDate, setPreviewOutsideDate] =
    useState<CalendarDate | null>(null)
  const highlightedRange = useMemo(() => {
    if (state.anchorDate && previewOutsideDate) {
      return previewOutsideDate.compare(state.anchorDate) < 0
        ? { start: previewOutsideDate, end: state.anchorDate }
        : { start: state.anchorDate, end: previewOutsideDate }
    }
    return state.highlightedRange
  }, [state.anchorDate, state.highlightedRange, previewOutsideDate])

  return (
    <div {...gridProps}>
      <div {...headerProps} role="row" className="flex">
        {weekDays.map((day, index) => (
          <div
            key={index}
            role="columnheader"
            className={`prose-label-md-medium flex ${dayCellSize} items-center justify-center text-base-content`}
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
                    onPreviewOutsideDate={setPreviewOutsideDate}
                  />
                ) : (
                  <div key={index} role="gridcell" className={dayCellSize} />
                ),
              )}
          </div>
        ))}
      </div>
    </div>
  )
}
