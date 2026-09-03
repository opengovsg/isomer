"use client"

import type { CalendarDate } from "@internationalized/date"
import type { AriaButtonProps } from "@react-aria/button"
import type { RangeCalendarState } from "@react-stately/calendar"
import {
  createCalendar,
  getWeeksInMonth,
  isToday,
  parseDate,
} from "@internationalized/date"
import { useButton } from "@react-aria/button"
import {
  useCalendarCell,
  useCalendarGrid,
  useRangeCalendar,
} from "@react-aria/calendar"
import { useRangeCalendarState } from "@react-stately/calendar"
import { useMemo, useRef, useState } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import { IconButton } from "../IconButton"

// Government sites are English-only today, so the locale is fixed rather
// than plumbed through `useLocale` (@react-aria/i18n) — avoids pulling in
// another dependency for a capability this codebase doesn't need yet.
const LOCALE = "en-SG"

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export interface RangeCalendarValue {
  start: CalendarDate
  end: CalendarDate
}

interface RangeCalendarProps {
  defaultValue: RangeCalendarValue | null
  onApply: (value: RangeCalendarValue | null) => void
}

const getTodayCalendarDate = (): CalendarDate =>
  parseDate(getSingaporeDateYYYYMMDD())

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
  const today = useMemo(() => getTodayCalendarDate(), [])
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
        <CalendarNavButton
          onPress={prevButtonProps.onPress}
          isDisabled={prevButtonProps.isDisabled}
          aria-label="Previous month"
          icon={BiChevronLeft}
        />
        <p className="prose-headline-base-semibold text-base-content">
          {title}
        </p>
        <CalendarNavButton
          onPress={nextButtonProps.onPress}
          isDisabled={nextButtonProps.isDisabled}
          aria-label="Next month"
          icon={BiChevronRight}
        />
      </div>
      <CalendarGrid
        state={state}
        onDateSelected={() => setHasUserSelected(true)}
      />
      <div className="mt-3 flex justify-end gap-3">
        <ClearButton onPress={() => onApply(null)} />
        <ApplyButton
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
        />
      </div>
    </div>
  )
}

const calendarActionButtonStyle =
  "prose-label-sm-medium rounded px-4 py-2.5 outline-0"

const ApplyButton = (props: Parameters<typeof useButton>[0]) => {
  const ref = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={`${calendarActionButtonStyle} bg-brand-canvas-inverse text-base-content-inverse`}
    >
      Apply
    </button>
  )
}

const ClearButton = (props: Parameters<typeof useButton>[0]) => {
  const ref = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={`${calendarActionButtonStyle} bg-white text-base-content`}
    >
      Clear
    </button>
  )
}

const CalendarNavButton = ({
  icon: Icon,
  "aria-label": ariaLabel,
  onPress,
  isDisabled,
}: Pick<AriaButtonProps, "onPress" | "isDisabled"> & {
  icon: typeof BiChevronLeft
  "aria-label": string
}) => {
  return (
    <IconButton
      icon={Icon}
      size="base"
      variant="clear"
      aria-label={ariaLabel}
      className="text-base-content-subtle"
      onPress={onPress}
      isDisabled={isDisabled}
    />
  )
}

// Plain flex rows rather than a <table> — avoids browser table-rendering
// quirks (hairline seams between adjacent <td> backgrounds) and lets range
// "fill" segments have a real gap between weeks. ARIA row/grid semantics are
// reproduced by hand via `role` since we're not using table elements.
const CalendarGrid = ({
  state,
  onDateSelected,
}: {
  state: RangeCalendarState
  onDateSelected: () => void
}) => {
  const { gridProps, headerProps, weekDays } = useCalendarGrid({}, state)
  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, LOCALE)

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
            className="prose-label-md-medium flex h-11 w-11 items-center justify-center text-base-content"
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
                    onDateSelected={onDateSelected}
                  />
                ) : (
                  <div key={index} role="gridcell" className="h-11 w-11" />
                ),
              )}
          </div>
        ))}
      </div>
    </div>
  )
}

const formatAccessibleDate = (date: CalendarDate, timeZone: string): string =>
  FULL_DATE_FORMATTER.format(date.toDate(timeZone))

const CalendarCell = ({
  state,
  date,
  highlightedRange,
  onHoverOutsideDate,
  onDateSelected,
}: {
  state: RangeCalendarState
  date: CalendarDate
  highlightedRange: { start: CalendarDate; end: CalendarDate } | null
  onHoverOutsideDate: (date: CalendarDate | null) => void
  onDateSelected: () => void
}) => {
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
        className={`flex h-11 w-11 items-center justify-center ${isInHighlightedRange ? "bg-base-canvas-backdrop" : ""} ${isRangeStart ? "rounded-l-full" : ""} ${isRangeEnd ? "rounded-r-full" : ""}`}
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
          className={`prose-label-md-medium flex h-11 w-11 items-center justify-center rounded-full outline-0 ring-inset hover:ring-2 hover:ring-base-content-strong ${
            isCurrentDate ? "ring-1 ring-base-content-strong" : ""
          } ${
            isEndpoint
              ? "bg-brand-canvas-inverse text-base-content-inverse"
              : "cursor-pointer text-base-content"
          } ${
            isOutsideVisibleRange && !isEndpoint
              ? "text-base-content-light"
              : ""
          } ${isDisabled && !isOutsideVisibleRange ? "text-base-content-subtle" : ""}`}
        >
          {formattedDate}
        </div>
      </div>
    </div>
  )
}
