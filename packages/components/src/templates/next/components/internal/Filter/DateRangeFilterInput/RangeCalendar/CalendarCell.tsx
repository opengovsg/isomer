"use client"

import type { CalendarDate } from "@internationalized/date"
import type { RangeCalendarState } from "@react-stately/calendar"
import { isToday } from "@internationalized/date"
import { useCalendarCell } from "@react-aria/calendar"
import { useRef } from "react"
import { tv } from "~/lib/tv"

import { FULL_DATE_FORMATTER } from "./constants"

const calendarCellRangeFillStyles = tv({
  base: "flex h-11 w-11 items-center justify-center",
  variants: {
    isInRange: {
      true: "bg-base-canvas-backdrop",
    },
    isRangeStart: {
      true: "rounded-l-full",
    },
    isRangeEnd: {
      true: "rounded-r-full",
    },
  },
})

const calendarCellButtonStyles = tv({
  base: "prose-label-md-medium flex h-11 w-11 items-center justify-center rounded-full outline-0 ring-inset hover:ring-2 hover:ring-base-content-strong",
  variants: {
    isCurrentDate: {
      true: "ring-1 ring-base-content-strong",
    },
    isEndpoint: {
      true: "bg-brand-canvas-inverse text-base-content-inverse",
      false: "cursor-pointer text-base-content",
    },
    isOutsideVisibleRange: {
      true: "text-base-content-light",
    },
    isDisabled: {
      true: "text-base-content-subtle",
    },
  },
})

interface CalendarCellProps {
  state: RangeCalendarState
  date: CalendarDate
  highlightedRange: { start: CalendarDate; end: CalendarDate } | null
  onHoverOutsideDate: (date: CalendarDate | null) => void
  onDateSelected: () => void
}

const formatAccessibleDate = (date: CalendarDate, timeZone: string): string =>
  FULL_DATE_FORMATTER.format(date.toDate(timeZone))

export const CalendarCell = ({
  state,
  date,
  highlightedRange,
  onHoverOutsideDate,
  onDateSelected,
}: CalendarCellProps) => {
  const cellRef = useRef<HTMLDivElement>(null)
  const {
    cellProps,
    buttonProps,
    isDisabled,
    isOutsideVisibleRange,
    formattedDate,
  } = useCalendarCell({ date }, state, cellRef)

  const accessibleDateLabel = formatAccessibleDate(date, state.timeZone)

  const isRangeStart =
    !!highlightedRange && date.compare(highlightedRange.start) === 0
  const isRangeEnd =
    !!highlightedRange && date.compare(highlightedRange.end) === 0
  const isEndpoint = isRangeStart || isRangeEnd
  const isInHighlightedRange =
    !!highlightedRange &&
    date.compare(highlightedRange.start) >= 0 &&
    date.compare(highlightedRange.end) <= 0
  const isCurrentDate = isToday(date, state.timeZone)

  // Outside-visible-range cells are disabled by react-aria by default (its
  // `isCellDisabled` treats anything outside the displayed month's page as
  // disabled) — bypassed here by calling the same `selectDate` the built-in
  // press handler uses internally, so adjacent-month days stay selectable
  // without paging the calendar away from the current view. Hover preview
  // is tracked separately (see `CalendarGrid`) for the same reason.
  const handleOutsideRangeClick = () => {
    state.selectDate(date)
    onDateSelected()
  }

  return (
    <div {...cellProps} className="h-11 w-11">
      <div
        className={calendarCellRangeFillStyles({
          isInRange: isInHighlightedRange,
          isRangeStart,
          isRangeEnd,
        })}
      >
        <div
          {...buttonProps}
          aria-label={accessibleDateLabel}
          onClick={(event) => {
            buttonProps.onClick?.(event)
            if (!isOutsideVisibleRange) {
              onDateSelected()
            }
          }}
          {...(isOutsideVisibleRange
            ? {
                "aria-disabled": undefined,
                onClick: handleOutsideRangeClick,
                onPointerEnter: () => onHoverOutsideDate(date),
                onPointerLeave: () => onHoverOutsideDate(null),
              }
            : {})}
          ref={cellRef}
          className={calendarCellButtonStyles({
            isCurrentDate,
            isEndpoint,
            isOutsideVisibleRange: isOutsideVisibleRange && !isEndpoint,
            isDisabled: isDisabled && !isOutsideVisibleRange,
          })}
        >
          {formattedDate}
        </div>
      </div>
    </div>
  )
}
