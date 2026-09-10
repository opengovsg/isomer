"use client"

import { useEffect, useId, useState } from "react"
import { tv } from "~/lib/tv"

export interface DateRangeFilterValue {
  start?: string
  end?: string
}

const dateRangeInputFieldStyles = tv({
  base: "prose-label-md-regular w-full rounded bg-white px-4 py-2 text-base-content shadow-[0_0_0_1.5px] outline-none placeholder:text-base-content-subtle focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-utility-feedback-info forced-colors:focus-visible:shadow-none forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2 forced-colors:focus-visible:outline-[Highlight]",
  variants: {
    isInvalid: {
      false: "shadow-base-divider-strong",
      true: "shadow-utility-feedback-error-medium",
    },
  },
})

interface DateRangeFilterInputProps {
  value: DateRangeFilterValue | undefined
  onChange: (value: DateRangeFilterValue | undefined) => void
}

const DATE_PLACEHOLDER = "yyyy-mm-dd"
const FROM_LABEL = "From"
const TO_LABEL = "To"

const toFilterValue = (
  start: string,
  end: string,
): DateRangeFilterValue | undefined => {
  if (!start && !end) {
    return undefined
  }

  const nextValue: DateRangeFilterValue = {}
  if (start) {
    nextValue.start = start
  }
  if (end) {
    nextValue.end = end
  }
  return nextValue
}

export const DateRangeFilterInput = ({
  value,
  onChange,
}: DateRangeFilterInputProps) => {
  const fromId = useId()
  const toId = useId()
  const errorId = useId()
  const [start, setStart] = useState(value?.start ?? "")
  const [end, setEnd] = useState(value?.end ?? "")
  const [validationError, setValidationError] = useState(false)

  useEffect(() => {
    setStart(value?.start ?? "")
    setEnd(value?.end ?? "")
    setValidationError(false)
  }, [value])

  const commitIfValid = ({
    nextStart,
    nextEnd,
  }: {
    nextStart: string
    nextEnd: string
  }) => {
    if (nextStart && nextEnd && nextStart > nextEnd) {
      setValidationError(true)
      return
    }

    setValidationError(false)
    onChange(toFilterValue(nextStart, nextEnd))
  }

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextStart = event.target.value
    setStart(nextStart)
    commitIfValid({ nextStart, nextEnd: end })
  }

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextEnd = event.target.value
    setEnd(nextEnd)
    commitIfValid({ nextStart: start, nextEnd })
  }

  // Native date pickers close on Escape. Stop bubbling so a parent dialog
  // (the mobile filter drawer) does not close at the same time.
  const stopEscapeFromBubbling = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation()
    }
  }

  return (
    <fieldset className="mx-2 mb-2 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="prose-headline-base-medium mb-2 text-base-content">
        Search by date or range
      </legend>

      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label
            htmlFor={fromId}
            className="prose-headline-base-medium text-base-content"
          >
            {FROM_LABEL}
          </label>
          <input
            id={fromId}
            type="date"
            value={start}
            max={end || undefined}
            placeholder={DATE_PLACEHOLDER}
            onChange={handleStartChange}
            onKeyDown={stopEscapeFromBubbling}
            className={dateRangeInputFieldStyles({
              isInvalid: !!validationError,
            })}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? errorId : undefined}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label
            htmlFor={toId}
            className="prose-headline-base-medium text-base-content"
          >
            {TO_LABEL}
          </label>
          <input
            id={toId}
            type="date"
            value={end}
            min={start || undefined}
            placeholder={DATE_PLACEHOLDER}
            onChange={handleEndChange}
            onKeyDown={stopEscapeFromBubbling}
            className={dateRangeInputFieldStyles({
              isInvalid: !!validationError,
            })}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? errorId : undefined}
          />
        </div>
      </div>

      {validationError && (
        <p
          id={errorId}
          role="alert"
          className="text-utility-feedback-error-medium prose-label-sm-regular"
        >
          {FROM_LABEL} date must be before or equal to {TO_LABEL} date
        </p>
      )}
    </fieldset>
  )
}
