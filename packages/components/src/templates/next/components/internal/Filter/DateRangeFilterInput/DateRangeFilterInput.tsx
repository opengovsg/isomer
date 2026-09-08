"use client"

import { useEffect, useId, useState } from "react"
import { tv } from "~/lib/tv"

export interface DateRangeFilterValue {
  start?: string
  end?: string
}

const dateRangeInputFieldStyles = tv({
  base: "prose-label-md-regular w-full rounded bg-white px-4 py-2 text-base-content shadow-[0_0_0_1.5px] outline-none placeholder:text-base-content-subtle focus:shadow-[0_0_0_2px] focus:shadow-utility-feedback-info",
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

  return (
    <div className="mx-2 mb-2 flex flex-col gap-2">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label
            htmlFor={fromId}
            className="prose-headline-base-medium text-base-content"
          >
            From
          </label>
          <input
            id={fromId}
            type="date"
            value={start}
            placeholder={DATE_PLACEHOLDER}
            onChange={handleStartChange}
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
            To
          </label>
          <input
            id={toId}
            type="date"
            value={end}
            placeholder={DATE_PLACEHOLDER}
            onChange={handleEndChange}
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
          From date must be before or equal to To date
        </p>
      )}
    </div>
  )
}
