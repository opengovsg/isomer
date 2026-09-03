"use client"

import { useState } from "react"

import {
  formatDateRangeInputChange,
  getDateRangeInputGhostSuffix,
  SINGLE_DATE_MASK,
} from "./dateRangeFilterInputFormatting"

const ALLOWED_INPUT_KEYS = new Set([
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Tab",
  "Enter",
  "Home",
  "End",
])

interface DateRangeFilterTextInputProps {
  id: string
  value: string
  onValueChange: (value: string) => void
  onCommit: () => void
  isInvalid?: boolean
  errorId?: string
}

export const DateRangeFilterTextInput = ({
  id,
  value,
  onValueChange,
  onCommit,
  isInvalid,
  errorId,
}: DateRangeFilterTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const ghostSuffix = getDateRangeInputGhostSuffix(value)
  const showGhostOverlay = isFocused && ghostSuffix.length > 0

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const { formattedValue, selectionStart } = formatDateRangeInputChange(
      input.value,
      input.selectionStart ?? input.value.length,
    )

    onValueChange(formattedValue)

    requestAnimationFrame(() => {
      input.setSelectionRange(selectionStart, selectionStart)
    })
  }

  return (
    <div className="relative flex h-full min-w-0 flex-1 items-center">
      {showGhostOverlay && (
        <div
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center"
          aria-hidden
        >
          <span className="prose-label-md-regular text-base-content">
            {value}
          </span>
          <span className="prose-label-md-regular text-base-content-subtle">
            {ghostSuffix}
          </span>
        </div>
      )}

      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        placeholder={isFocused ? undefined : SINGLE_DATE_MASK}
        aria-label={SINGLE_DATE_MASK}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false)
          onCommit()
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommit()
            return
          }

          if (event.ctrlKey || event.metaKey || event.altKey) {
            return
          }

          if (ALLOWED_INPUT_KEYS.has(event.key)) {
            return
          }

          if (/^\d$/.test(event.key)) {
            return
          }

          event.preventDefault()
        }}
        className="prose-label-md-regular w-full border-0 bg-transparent py-2 pl-4 text-base-content outline-none placeholder:text-base-content-subtle data-[ghost-overlay]:text-transparent data-[ghost-overlay]:caret-base-content"
        data-ghost-overlay={showGhostOverlay ? "" : undefined}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={errorId}
      />
    </div>
  )
}
