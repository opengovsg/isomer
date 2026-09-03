"use client"

import { parseDate } from "@internationalized/date"
import { FocusScope, useFocusRing } from "@react-aria/focus"
import { useEffect, useId, useRef, useState } from "react"
import { BiCalendar } from "react-icons/bi"
import { useOnClickOutside } from "usehooks-ts"
import { tv } from "~/lib/tv"

import type { RangeCalendarValue } from "./RangeCalendar/types"
import {
  parseInputText,
  valueToInputText,
  type DateRangeFilterValue,
} from "./dateRangeFilterInputText"
import { DateRangeFilterTextInput } from "./DateRangeFilterTextInput"
import { RangeCalendar } from "./RangeCalendar/RangeCalendar"

export type { DateRangeFilterValue }

const dateRangeInputFieldStyles = tv({
  base: "flex w-full items-stretch rounded bg-white shadow-[0_0_0_1.5px]",
  variants: {
    isInvalid: {
      false: "shadow-base-divider-strong",
      true: "shadow-utility-feedback-error-medium",
    },
  },
})

const calendarTriggerStyles = tv({
  base: "shrink-0 self-stretch rounded-r border-l border-base-divider-strong p-2.5 text-base-content-subtle outline-none",
  variants: {
    isFocused: {
      // Clip the left of the 2px ring so it sits on the divider instead of
      // spilling into the input; draw that side with an inset stroke.
      true: "relative z-10 shadow-[inset_2px_0_0_0] shadow-utility-feedback-info [box-shadow:0_0_0_2px_var(--tw-shadow-color),inset_2px_0_0_0_var(--tw-shadow-color)] [clip-path:inset(-2px_-2px_-2px_0)]",
    },
  },
})

interface DateRangeFilterInputProps {
  value: DateRangeFilterValue | undefined
  onChange: (value: DateRangeFilterValue | undefined) => void
}

const INPUT_ERROR_MESSAGE = "Enter a valid date in DD/MM/YYYY format"

export const DateRangeFilterInput = ({
  value,
  onChange,
}: DateRangeFilterInputProps) => {
  const inputId = useId()
  const popoverId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => valueToInputText(value))
  const [inputError, setInputError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarTriggerRef = useRef<HTMLButtonElement>(null)
  const { focusProps: triggerFocusProps, isFocused: isTriggerFocused } =
    useFocusRing()

  useEffect(() => {
    setInputValue(valueToInputText(value))
    setInputError(null)
  }, [value])

  useOnClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false)
    }
  })

  const closeCalendar = () => {
    setIsOpen(false)
    calendarTriggerRef.current?.focus()
  }

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

  return (
    <div className="mx-2 mb-2 flex flex-col gap-2" ref={containerRef}>
      <label
        htmlFor={inputId}
        className="prose-headline-base-medium text-base-content"
      >
        Or, search for a date
      </label>

      <div className="relative">
        <div
          className={dateRangeInputFieldStyles({
            isInvalid: !!inputError,
          })}
        >
          <div className="min-w-0 flex-1 self-stretch rounded-l focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px] focus-within:shadow-utility-feedback-info">
            <DateRangeFilterTextInput
              id={inputId}
              value={inputValue}
              onValueChange={(nextValue) => {
                setInputValue(nextValue)
                setInputError(null)
              }}
              onCommit={commitInputValue}
              isInvalid={!!inputError}
              errorId={inputError ? "date-range-filter-error" : undefined}
            />
          </div>
          <button
            {...triggerFocusProps}
            ref={calendarTriggerRef}
            type="button"
            className={calendarTriggerStyles({
              isFocused: isTriggerFocused,
            })}
            aria-label="Open calendar"
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={isOpen ? popoverId : undefined}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <BiCalendar aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {inputError && (
          <p
            id="date-range-filter-error"
            role="alert"
            className="text-utility-feedback-error-medium prose-label-sm-regular mt-1"
          >
            {inputError}
          </p>
        )}

        {isOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
              aria-label="Dismiss calendar"
              onClick={closeCalendar}
            />
            <FocusScope contain restoreFocus>
              {/* Same `lg` breakpoint as Filter / FilterDrawer: overlay below lg, popover at lg+. */}
              <div className="z-50 max-lg:pointer-events-none max-lg:fixed max-lg:inset-0 max-lg:flex max-lg:items-center max-lg:justify-center max-lg:p-4 lg:absolute lg:mt-1">
                <div
                  id={popoverId}
                  role="dialog"
                  aria-label="Select date range"
                  className="pointer-events-auto w-fit max-w-sm rounded-md border border-base-divider-medium bg-white p-4 shadow-md max-[374px]:p-3"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault()
                      closeCalendar()
                    }
                  }}
                >
                  <RangeCalendar
                    key={value ? `${value.start}-${value.end}` : "empty"}
                    defaultValue={calendarValue}
                    onApply={handleCalendarApply}
                  />
                </div>
              </div>
            </FocusScope>
          </>
        )}
      </div>
    </div>
  )
}
