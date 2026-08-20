"use client"

import { parseDate } from "@internationalized/date"
import { useRef, useState } from "react"
import { BiCalendar } from "react-icons/bi"
import { useOnClickOutside } from "usehooks-ts"

import type { RangeCalendarValue } from "./RangeCalendar"
import { RangeCalendar } from "./RangeCalendar"

export interface DateRangeFilterValue {
  start: string
  end: string
}

interface DateRangeFilterInputProps {
  value: DateRangeFilterValue | undefined
  onChange: (value: DateRangeFilterValue | undefined) => void
}

// "yyyy-MM-dd" (the ISO format both this filter's value and
// `@internationalized/date`'s `CalendarDate.toString()` use) -> "DD/MM/YYYY"
const toDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

// Hand-built, no `@opengovsg/design-system-react` dependency — this package
// (published to every site) has none, unlike Studio's admin editing UI.
// Clicking the field (not typing — a calendar is a clearer, less error-prone
// way to pick a date than free text) opens a single-month range calendar
// (see RangeCalendar.tsx) for visual selection. See wayfinder ticket 009.
export const DateRangeFilterInput = ({
  value,
  onChange,
}: DateRangeFilterInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(containerRef, () => setIsOpen(false))

  const displayValue = value
    ? value.start === value.end
      ? toDisplayDate(value.start)
      : `${toDisplayDate(value.start)} - ${toDisplayDate(value.end)}`
    : ""

  const calendarValue: RangeCalendarValue | null = value
    ? { start: parseDate(value.start), end: parseDate(value.end) }
    : null

  const handleCalendarApply = (range: RangeCalendarValue | null) => {
    if (!range) {
      onChange(undefined)
      setIsOpen(false)
      return
    }

    onChange({ start: range.start.toString(), end: range.end.toString() })
    setIsOpen(false)
  }

  return (
    <div className="mx-2 mb-2 flex flex-col gap-2" ref={containerRef}>
      <p className="prose-headline-base-medium text-base-content">
        Or, enter a date
      </p>

      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded border-[1.5px] border-base-divider-strong bg-white py-2 pl-4 pr-2 text-left"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span
            className={`prose-label-md-regular ${displayValue ? "text-base-content" : "text-base-content-subtle"}`}
          >
            {displayValue || "DD/MM/YYYY"}
          </span>
          <span className="shrink-0 p-2.5">
            <BiCalendar
              aria-hidden
              className="h-5 w-5 text-base-content-subtle"
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-fit rounded-md border border-base-divider-medium bg-white p-4 shadow-md">
            <RangeCalendar
              defaultValue={calendarValue}
              onApply={handleCalendarApply}
            />
          </div>
        )}
      </div>
    </div>
  )
}
