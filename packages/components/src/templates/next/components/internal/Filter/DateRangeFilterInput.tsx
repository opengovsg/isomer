"use client"

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { parseDate } from "@internationalized/date"
import { useEffect, useRef, useState } from "react"
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
  /** Desktop sidebar uses a popover; mobile filter drawer uses a modal. */
  presentation?: "popover" | "modal"
  label?: string
}

const DEFAULT_LABEL = "Or, search for a date"
const INPUT_ERROR_MESSAGE = "Enter a valid date in DD/MM/YYYY format"

// "yyyy-MM-dd" (the ISO format both this filter's value and
// `@internationalized/date`'s `CalendarDate.toString()` use) -> "DD/MM/YYYY"
const toDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

const valueToInputText = (value: DateRangeFilterValue | undefined): string => {
  if (!value) {
    return ""
  }

  if (value.start === value.end) {
    return toDisplayDate(value.start)
  }

  return `${toDisplayDate(value.start)} - ${toDisplayDate(value.end)}`
}

const parseSingleDisplayDate = (displayDate: string): string | undefined => {
  const match = displayDate.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return undefined
  }

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`

  try {
    parseDate(isoDate)
    return isoDate
  } catch {
    return undefined
  }
}

const parseInputText = (
  text: string,
): DateRangeFilterValue | undefined | null => {
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }

  const rangeParts = trimmed.split(/\s*-\s*/)
  if (rangeParts.length === 1) {
    const isoDate = parseSingleDisplayDate(rangeParts[0]!)
    return isoDate ? { start: isoDate, end: isoDate } : null
  }

  if (rangeParts.length === 2) {
    const start = parseSingleDisplayDate(rangeParts[0]!)
    const end = parseSingleDisplayDate(rangeParts[1]!)
    if (!start || !end) {
      return null
    }
    return { start, end }
  }

  return null
}

// Hand-built, no `@opengovsg/design-system-react` dependency — this package
// (published to every site) has none, unlike Studio's admin editing UI.
// Supports typed DD/MM/YYYY entry with inline validation, plus a calendar
// popover for visual range selection. See wayfinder ticket 009.
export const DateRangeFilterInput = ({
  value,
  onChange,
  presentation = "popover",
  label = DEFAULT_LABEL,
}: DateRangeFilterInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => valueToInputText(value))
  const [inputError, setInputError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(valueToInputText(value))
    setInputError(null)
  }, [value])

  useOnClickOutside(containerRef, () => {
    if (presentation === "popover") {
      setIsOpen(false)
    }
  })

  const calendarValue: RangeCalendarValue | null = value
    ? { start: parseDate(value.start), end: parseDate(value.end) }
    : null

  const handleCalendarApply = (range: RangeCalendarValue | null) => {
    if (!range) {
      onChange(undefined)
      setInputValue("")
      setInputError(null)
      setIsOpen(false)
      return
    }

    const nextValue = {
      start: range.start.toString(),
      end: range.end.toString(),
    }
    onChange(nextValue)
    setInputValue(valueToInputText(nextValue))
    setInputError(null)
    setIsOpen(false)
  }

  const commitInputValue = () => {
    const parsed = parseInputText(inputValue)
    if (parsed === null) {
      setInputError(INPUT_ERROR_MESSAGE)
      return
    }

    setInputError(null)
    onChange(parsed)
    setInputValue(valueToInputText(parsed))
  }

  const calendar = (
    <RangeCalendar
      key={value ? `${value.start}-${value.end}` : "empty"}
      defaultValue={calendarValue}
      onApply={handleCalendarApply}
    />
  )

  return (
    <div className="mx-2 mb-2 flex flex-col gap-2" ref={containerRef}>
      <p className="prose-headline-base-medium text-base-content">{label}</p>

      <div className="relative">
        <div
          className={`flex w-full items-center rounded border-[1.5px] bg-white ${
            inputError
              ? "border-utility-feedback-error-medium"
              : "border-base-divider-strong"
          }`}
        >
          <input
            type="text"
            value={inputValue}
            placeholder="DD/MM/YYYY"
            onChange={(event) => {
              setInputValue(event.target.value)
              setInputError(null)
            }}
            onBlur={commitInputValue}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitInputValue()
              }
            }}
            className="prose-label-md-regular min-w-0 flex-1 border-0 bg-transparent py-2 pl-4 text-base-content outline-0 placeholder:text-base-content-subtle"
            aria-invalid={inputError ? true : undefined}
            aria-describedby={
              inputError ? "date-range-filter-error" : undefined
            }
          />
          <button
            type="button"
            className="shrink-0 p-2.5 text-base-content-subtle outline-0"
            aria-label="Open calendar"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <BiCalendar aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {inputError && (
          <p
            id="date-range-filter-error"
            className="text-utility-feedback-error-medium prose-label-sm-regular mt-1"
          >
            {inputError}
          </p>
        )}

        {isOpen && presentation === "popover" && (
          <div className="absolute z-10 mt-1 w-fit rounded-md border border-base-divider-medium bg-white p-4 shadow-md">
            {calendar}
          </div>
        )}
      </div>

      {presentation === "modal" && (
        <Dialog
          open={isOpen}
          onClose={setIsOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <DialogPanel
              transition
              className="w-full max-w-sm rounded-md border border-base-divider-medium bg-white p-4 shadow-md transition duration-300 ease-in-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {calendar}
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </div>
  )
}
