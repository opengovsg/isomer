"use client"

import { GregorianCalendar, parseDate } from "@internationalized/date"
import { useRangeCalendar } from "@react-aria/calendar"
import { useRangeCalendarState } from "@react-stately/calendar"
import { forwardRef, useRef } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"
import { mergeRefs } from "~/utils/rac"

import type { RangeCalendarValue } from "./types"
import { IconButton } from "../../../IconButton"
import { CalendarActionButton } from "./CalendarActionButton"
import { CalendarGrid } from "./CalendarGrid"

interface RangeCalendarProps {
  defaultValue: RangeCalendarValue | null
  onApply: (value: RangeCalendarValue | null) => void
}

// en-SG only; filter values are yyyy-MM-dd Gregorian. GregorianCalendar
// instead of createCalendar avoids bundling every calendar system Adobe ships.
const createGregorianCalendar = () => new GregorianCalendar()

// Uncontrolled: parent only hears about selection on Apply. With no value,
// today is staged in the grid until Apply or Clear.
export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(
  function RangeCalendar({ defaultValue, onApply }, ref) {
    const today = parseDate(getSingaporeDateYYYYMMDD())
    const initialValue = defaultValue ?? { start: today, end: today }

    const state = useRangeCalendarState({
      locale: "en-SG",
      createCalendar: createGregorianCalendar,
      defaultValue: initialValue,
      visibleDuration: { months: 1 },
      defaultFocusedValue: defaultValue?.start ?? today,
    })

    const calendarRef = useRef<HTMLDivElement>(null)
    const { calendarProps, prevButtonProps, nextButtonProps, title } =
      useRangeCalendar(
        { "aria-label": "Select date range" },
        state,
        calendarRef,
      )

    return (
      <div
        {...calendarProps}
        ref={mergeRefs(calendarRef, ref)}
        className="w-fit"
      >
        <div className="mb-3 flex items-center justify-between">
          <IconButton
            icon={BiChevronLeft}
            size="base"
            variant="clear"
            aria-label={prevButtonProps["aria-label"] ?? "Previous month"}
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
            aria-label={nextButtonProps["aria-label"] ?? "Next month"}
            className="text-base-content-subtle"
            onPress={nextButtonProps.onPress}
            isDisabled={nextButtonProps.isDisabled}
          />
        </div>
        <CalendarGrid state={state} />
        <div className="mt-3 flex justify-end gap-3">
          <CalendarActionButton variant="clear" onPress={() => onApply(null)}>
            Clear
          </CalendarActionButton>
          <CalendarActionButton
            variant="apply"
            onPress={() => {
              // One click only sets anchorDate, not value. Apply after one click
              // should still commit that day as start and end.
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
  },
)
