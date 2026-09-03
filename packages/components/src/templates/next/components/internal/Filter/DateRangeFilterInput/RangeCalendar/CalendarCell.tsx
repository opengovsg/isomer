"use client"

import type { CalendarDate } from "@internationalized/date"
import type { RangeCalendarState } from "@react-stately/calendar"
import { isToday } from "@internationalized/date"
import { useCalendarCell } from "@react-aria/calendar"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { useRef, type KeyboardEvent, type MouseEvent } from "react"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/tailwind"

import { dayCellSize } from "./dayCellSize"

const calendarCellRangeFillStyles = tv({
  base: `flex ${dayCellSize} items-center justify-center`,
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
  extend: focusRing,
  base: `prose-label-md-medium flex ${dayCellSize} items-center justify-center rounded-full ring-inset hover:ring-2 hover:ring-base-content-strong`,
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
  onPreviewOutsideDate: (date: CalendarDate | null) => void
}

export const CalendarCell = ({
  state,
  date,
  highlightedRange,
  onPreviewOutsideDate,
}: CalendarCellProps) => {
  const cellRef = useRef<HTMLButtonElement>(null)
  const {
    cellProps,
    buttonProps,
    isDisabled,
    isOutsideVisibleRange,
    formattedDate,
  } = useCalendarCell({ date }, state, cellRef)
  const { focusProps, isFocusVisible } = useFocusRing()

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
  const selectOutsideVisibleDate = () => {
    state.selectDate(date)
  }

  const outsideVisibleRangeProps = {
    "aria-disabled": undefined,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      selectOutsideVisibleDate()
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        selectOutsideVisibleDate()
        return
      }

      buttonProps.onKeyDown?.(event)
    },
    onPointerEnter: () => onPreviewOutsideDate(date),
    onPointerLeave: () => onPreviewOutsideDate(null),
    onFocus: () => onPreviewOutsideDate(date),
    onBlur: () => onPreviewOutsideDate(null),
  }

  const previewProps = isOutsideVisibleRange
    ? outsideVisibleRangeProps
    : {
        onFocus: () => onPreviewOutsideDate(null),
      }

  const mergedButtonProps = mergeProps(buttonProps, focusProps, previewProps)

  return (
    <div
      {...cellProps}
      className={`${dayCellSize}${isFocusVisible ? " relative z-10" : ""}`}
    >
      <div
        className={calendarCellRangeFillStyles({
          isInRange: isInHighlightedRange,
          isRangeStart,
          isRangeEnd,
        })}
      >
        <button
          {...mergedButtonProps}
          ref={cellRef}
          type="button"
          className={calendarCellButtonStyles({
            isFocusVisible,
            isCurrentDate,
            isEndpoint,
            isOutsideVisibleRange: isOutsideVisibleRange && !isEndpoint,
            isDisabled: isDisabled && !isOutsideVisibleRange,
          })}
        >
          {formattedDate}
        </button>
      </div>
    </div>
  )
}
