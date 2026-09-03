"use client"

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { parseDate } from "@internationalized/date"
import { FocusScope, useFocusRing } from "@react-aria/focus"
import { useFocusWithin } from "@react-aria/interactions"
import { mergeProps } from "@react-aria/utils"
import { useEffect, useId, useRef, useState } from "react"
import { BiCalendar } from "react-icons/bi"
import { useOnClickOutside } from "usehooks-ts"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/tailwind"

import type { RangeCalendarValue } from "./RangeCalendar/types"
import {
  parseInputText,
  valueToInputText,
  type DateRangeFilterValue,
} from "./dateRangeFilterInputText"
import { RangeCalendar } from "./RangeCalendar/RangeCalendar"

export type { DateRangeFilterValue }

const dateRangeInputFieldStyles = tv({
  base: "flex w-full items-center rounded border-[1.5px] bg-white",
  variants: {
    isInvalid: {
      false: "border-base-divider-strong",
      true: "border-utility-feedback-error-medium",
    },
    isFocusWithin: {
      true: "shadow-[0_0_0_2px] shadow-utility-feedback-info",
    },
  },
})

const calendarTriggerStyles = tv({
  extend: focusRing,
  base: "shrink-0 p-2.5 text-base-content-subtle",
})

interface DateRangeFilterInputProps {
  value: DateRangeFilterValue | undefined
  onChange: (value: DateRangeFilterValue | undefined) => void
  /** Desktop sidebar uses a popover; mobile filter drawer uses a modal. */
  presentation?: "popover" | "modal"
}

const INPUT_ERROR_MESSAGE = "Enter a valid date in DD/MM/YYYY format"

export const DateRangeFilterInput = ({
  value,
  onChange,
  presentation = "popover",
}: DateRangeFilterInputProps) => {
  const inputId = useId()
  const popoverId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [inputValue, setInputValue] = useState(() => valueToInputText(value))
  const [inputError, setInputError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarTriggerRef = useRef<HTMLButtonElement>(null)
  const {
    focusProps: triggerFocusProps,
    isFocusVisible: isTriggerFocusVisible,
  } = useFocusRing()
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  })

  useEffect(() => {
    setInputValue(valueToInputText(value))
    setInputError(null)
  }, [value])

  useOnClickOutside(containerRef, () => {
    if (presentation === "popover" && isOpen) {
      setIsOpen(false)
    }
  })

  const closePopover = () => {
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

  const calendar = (
    <RangeCalendar
      key={value ? `${value.start}-${value.end}` : "empty"}
      defaultValue={calendarValue}
      onApply={handleCalendarApply}
    />
  )

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
          {...focusWithinProps}
          className={dateRangeInputFieldStyles({
            isInvalid: !!inputError,
            isFocusWithin,
          })}
        >
          <input
            id={inputId}
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
            className="prose-label-md-regular min-w-0 flex-1 border-0 bg-transparent py-2 pl-4 text-base-content outline-none placeholder:text-base-content-subtle"
            aria-invalid={inputError ? true : undefined}
            aria-describedby={
              inputError ? "date-range-filter-error" : undefined
            }
          />
          <button
            {...mergeProps(triggerFocusProps)}
            ref={calendarTriggerRef}
            type="button"
            className={calendarTriggerStyles({
              isFocusVisible: isTriggerFocusVisible,
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

        {isOpen && presentation === "popover" && (
          <FocusScope contain restoreFocus autoFocus>
            <div
              id={popoverId}
              className="absolute z-10 mt-1 w-fit rounded-md border border-base-divider-medium bg-white p-4 shadow-md"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault()
                  closePopover()
                }
              }}
            >
              {calendar}
            </div>
          </FocusScope>
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
