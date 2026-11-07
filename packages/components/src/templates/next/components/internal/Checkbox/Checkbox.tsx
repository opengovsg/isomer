"use client"

import type { ReactNode } from "react"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { BiCheck, BiMinus } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils/tailwind"

interface CheckboxGroupContextValue {
  value: string[]
  setValue: (next: string[]) => void
  isDisabled?: boolean
  isReadOnly?: boolean
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
)

interface CheckboxGroupProps {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string
  className?: string
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  isDisabled?: boolean
  isReadOnly?: boolean
  "aria-label"?: string
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    label,
    children,
    description,
    errorMessage,
    className,
    value,
    defaultValue,
    onChange,
    isDisabled,
    isReadOnly,
    "aria-label": ariaLabel,
  } = props

  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? [])
  const selected = value ?? uncontrolled
  const setValue = (next: string[]) => {
    if (value === undefined) {
      setUncontrolled(next)
    }
    onChange?.(next)
  }

  return (
    <CheckboxGroupContext.Provider
      value={{
        value: selected,
        setValue,
        isDisabled,
        isReadOnly,
      }}
    >
      <div
        role="group"
        aria-label={ariaLabel}
        className={twMerge("flex flex-col gap-4", className)}
      >
        {label && (
          <div className="prose-body-base-semibold text-base-content-strong">
            {label}
          </div>
        )}
        {description && (
          <div className="prose-body-base text-base-content">{description}</div>
        )}
        {children}
        {errorMessage && (
          <div className="prose-body-base text-red-700">{errorMessage}</div>
        )}
      </div>
    </CheckboxGroupContext.Provider>
  )
}

const checkboxStyles = tv({
  base: "group prose-body-base flex items-start gap-3 transition",
  variants: {
    isDisabled: {
      false: "text-base-content-strong",
      true: "text-interaction-support-placeholder forced-colors:text-[GrayText]",
    },
  },
})

const boxStyles = tv({
  extend: focusRing,
  base: "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition",
  variants: {
    isSelected: {
      false:
        "border-[--color] bg-white [--color:theme(colors.base.divider.medium)] group-active:[--color:theme(colors.base.divider.strong)]",
      true: "border-[--color] bg-[--color] [--color:theme(colors.brand.interaction.DEFAULT)] group-active:[--color:theme(colors.brand.interaction.pressed)] forced-colors:![--color:Highlight]",
    },
    isInvalid: {
      true: "[--color:theme(colors.red.700)] group-active:[--color:theme(colors.red.800)] forced-colors:![--color:Mark]",
    },
    isDisabled: {
      true: "[--color:theme(colors.gray.200)] forced-colors:![--color:GrayText]",
    },
  },
})

const iconStyles =
  "w-4 h-4 text-white group-disabled:text-gray-400 forced-colors:text-[HighlightText]"

interface CheckboxProps {
  children?: ReactNode
  className?: string
  value?: string
  isSelected?: boolean
  defaultSelected?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  isInvalid?: boolean
  isIndeterminate?: boolean
  onChange?: (isSelected: boolean) => void
}

export function Checkbox(props: CheckboxProps) {
  const {
    children,
    className,
    value,
    isSelected,
    defaultSelected,
    isDisabled: isDisabledProp,
    isReadOnly: isReadOnlyProp,
    isInvalid,
    isIndeterminate,
    onChange,
  } = props

  const group = useContext(CheckboxGroupContext)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uncontrolled, setUncontrolled] = useState(defaultSelected ?? false)

  const isDisabled = isDisabledProp ?? group?.isDisabled ?? false
  const isReadOnly = isReadOnlyProp ?? group?.isReadOnly ?? false
  const selected = group
    ? group.value.includes(value ?? "")
    : (isSelected ?? uncontrolled)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!isIndeterminate
    }
  }, [isIndeterminate])

  const { focusProps, isFocusVisible } = useFocusRing()

  const setSelected = (next: boolean) => {
    if (isDisabled || isReadOnly) {
      return
    }
    if (group) {
      const key = value ?? ""
      group.setValue(
        next
          ? group.value.includes(key)
            ? group.value
            : [...group.value, key]
          : group.value.filter((item) => item !== key),
      )
    } else if (isSelected === undefined) {
      setUncontrolled(next)
    }
    onChange?.(next)
  }

  return (
    <label
      className={twMerge(
        checkboxStyles({ isDisabled: !!isDisabled }),
        className,
      )}
      data-selected={selected || isIndeterminate ? "true" : undefined}
    >
      <input
        {...mergeProps(focusProps, {
          type: "checkbox" as const,
          checked: selected || !!isIndeterminate,
          disabled: isDisabled,
          readOnly: isReadOnly,
          onChange: () => setSelected(!selected),
        })}
        ref={inputRef}
        className="sr-only"
      />
      <div className="flex items-center justify-center before:invisible before:w-0 before:content-['hidden']">
        <div
          className={boxStyles({
            isSelected: selected || !!isIndeterminate,
            isInvalid: !!isInvalid,
            isDisabled: !!isDisabled,
            isFocusVisible,
          })}
        >
          {isIndeterminate ? (
            <BiMinus aria-hidden className={iconStyles} />
          ) : selected ? (
            <BiCheck aria-hidden className={iconStyles} />
          ) : null}
        </div>
      </div>
      {children}
    </label>
  )
}
