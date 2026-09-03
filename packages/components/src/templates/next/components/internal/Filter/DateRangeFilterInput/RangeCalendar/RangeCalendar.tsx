"use client"

import { createCalendar, parseDate } from "@internationalized/date"
import { useRangeCalendar } from "@react-aria/calendar"
import { useRangeCalendarState } from "@react-stately/calendar"
import { useRef, useState } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import type { RangeCalendarValue } from "./types"
import { IconButton } from "../../../IconButton"
import { CalendarActionButton } from "./CalendarActionButton"
import { CalendarGrid } from "./CalendarGrid"
import { LOCALE } from "./constants"

interface RangeCalendarProps {
  defaultValue: RangeCalendarValue | null
  onApply: (value: RangeCalendarValue | null) => void
}

// Hand-built on top of the same headless @react-aria/* hook family already
// used elsewhere in this package (see Filter.tsx), rather than pulling in a
// full pre-styled component library — this package ships to every site and
// stays dependency-light. Hook wiring follows the standard react-aria
// range-calendar pattern (referenced from
// github.com/opengovsg/oui-design-system's date-range-picker for structure).
//
// Selection is uncontrolled (`defaultValue`, no `value`/`onChange` binding):
// clicking dates updates the calendar's own visible selection immediately,
// but the parent only learns about it when "Apply" is pressed — an explicit
// commit step rather than applying on every click.
export const RangeCalendar = ({
  defaultValue,
  onApply,
}: RangeCalendarProps) => {
  const today = parseDate(getSingaporeDateYYYYMMDD())
  const initialValue = defaultValue ?? { start: today, end: today }
  const [hasUserSelected, setHasUserSelected] = useState(false)

  const state = useRangeCalendarState({
    locale: LOCALE,
    createCalendar,
    defaultValue: initialValue,
    visibleDuration: { months: 1 },
    defaultFocusedValue: defaultValue?.start ?? today,
  })

  const calendarRef = useRef<HTMLDivElement>(null)
  const { calendarProps, prevButtonProps, nextButtonProps, title } =
    useRangeCalendar({}, state, calendarRef)

  return (
    <div {...calendarProps} ref={calendarRef} className="w-fit">
      <div className="mb-3 flex items-center justify-between">
        <IconButton
          icon={BiChevronLeft}
          size="base"
          variant="clear"
          aria-label="Previous month"
          className="text-base-content-subtle"
          onPress={prevButtonProps.onPress}
          isDisabled={prevButtonProps.isDisabled}
        />
        <p className="prose-headline-base-semibold text-base-content">
          {title}
        </p>
        <IconButton
          icon={BiChevronRight}
          size="base"
          variant="clear"
          aria-label="Next month"
          className="text-base-content-subtle"
          onPress={nextButtonProps.onPress}
          isDisabled={nextButtonProps.isDisabled}
        />
      </div>
      <CalendarGrid
        state={state}
        onDateSelected={() => setHasUserSelected(true)}
      />
      <div className="mt-3 flex justify-end gap-3">
        <CalendarActionButton variant="clear" onPress={() => onApply(null)}>
          Clear
        </CalendarActionButton>
        <CalendarActionButton
          variant="apply"
          onPress={() => {
            if (defaultValue === null && !hasUserSelected) {
              onApply(null)
              return
            }

            // A single click only sets `anchorDate` (selection in progress)
            // — `value` isn't populated until a second click completes the
            // range, so pressing Apply after just one click would otherwise
            // silently do nothing. Treat it as a single-day selection
            // instead, consistent with how a date with no `endDate` is
            // already modelled elsewhere as a 1-day event — and it matches
            // what's already visually highlighted (the anchor renders as a
            // full single-day circle before a second date is picked).
            const value = state.anchorDate
              ? { start: state.anchorDate, end: state.anchorDate }
              : state.value
            onApply(value)
          }}
        >
          Apply
        </CalendarActionButton>
      </div>
    </div>
  )
}
