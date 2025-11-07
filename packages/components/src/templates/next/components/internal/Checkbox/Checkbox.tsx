"use client"

import type { CheckboxGroupState } from "@react-stately/checkbox"
import type { ReactNode } from "react"
import type { AriaCheckboxGroupProps, AriaCheckboxProps } from "react-aria"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useCheckboxGroupState } from "@react-stately/checkbox"
import {
  mergeProps,
  useCheckbox,
  useCheckboxGroup,
  useCheckboxGroupItem,
  useFocusRing,
} from "react-aria"
import { BiCheck, BiMinus } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils"

interface CheckboxGroupContextValue {
  state: CheckboxGroupState
  isDisabled?: boolean
  isReadOnly?: boolean
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
)

export interface CheckboxGroupProps extends AriaCheckboxGroupProps {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string
  className?: string
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    label,
    children,
    description,
    errorMessage,
    className,
    ...groupProps
  } = props

  const state = useCheckboxGroupState(groupProps)
  const {
    groupProps: ariaGroupProps,
    labelProps,
    descriptionProps,
    errorMessageProps,
  } = useCheckboxGroup(groupProps, state)

  return (
    <CheckboxGroupContext.Provider
      value={{
        state,
        isDisabled: groupProps.isDisabled,
        isReadOnly: groupProps.isReadOnly,
      }}
    >
      <div
        {...ariaGroupProps}
        className={twMerge("flex flex-col gap-4", className)}
      >
        {label && (
          <div
            {...labelProps}
            className="prose-body-base-semibold text-base-content-strong"
          >
            {label}
          </div>
        )}
        {description && (
          <div
            {...descriptionProps}
            className="prose-body-base text-base-content"
          >
            {description}
          </div>
        )}
        {children}
        {errorMessage && (
          <div {...errorMessageProps} className="prose-body-base text-red-700">
            {errorMessage}
          </div>
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
        "border-[--color] bg-white [--color:theme(colors.base.divider.medium)] group-pressed:[--color:theme(colors.base.divider.strong)]",
      true: "border-[--color] bg-[--color] [--color:theme(colors.brand.interaction.DEFAULT)] group-pressed:[--color:theme(colors.brand.interaction.pressed)] forced-colors:![--color:Highlight]",
    },
    isInvalid: {
      true: "[--color:theme(colors.red.700)] group-pressed:[--color:theme(colors.red.800)] forced-colors:![--color:Mark]",
    },
    isDisabled: {
      true: "[--color:theme(colors.gray.200)] forced-colors:![--color:GrayText]",
    },
  },
})

const iconStyles =
  "w-4 h-4 text-white group-disabled:text-gray-400 forced-colors:text-[HighlightText]"

// Simple toggle state hook for standalone checkboxes
function useToggleState(props: AriaCheckboxProps) {
  const [isSelected, setIsSelected] = useState(props.isSelected ?? false)

  // Sync with controlled prop
  useEffect(() => {
    if (props.isSelected !== undefined) {
      setIsSelected(props.isSelected)
    }
  }, [props.isSelected])

  const setSelected = (selected: boolean) => {
    if (props.isSelected === undefined) {
      setIsSelected(selected)
    }
    props.onChange?.(selected)
  }

  const toggle = () => {
    setSelected(!isSelected)
  }

  return {
    isSelected,
    setSelected,
    toggle,
  }
}

export interface CheckboxProps extends AriaCheckboxProps {
  children?: ReactNode
  className?: string
}

export function Checkbox(props: CheckboxProps) {
  const { children, className, ...checkboxProps } = props
  const groupContext = useContext(CheckboxGroupContext)

  const ref = useRef<HTMLInputElement>(null)
  const isDisabled = checkboxProps.isDisabled ?? groupContext?.isDisabled
  const isReadOnly = checkboxProps.isReadOnly ?? groupContext?.isReadOnly

  // Always create standalone state (hooks must be called unconditionally)
  const standaloneState = useToggleState(checkboxProps)

  // Determine if we're in a group
  const isInGroup = groupContext !== null && checkboxProps.value !== undefined

  // For grouped checkboxes, useCheckboxGroupItem; for standalone, use useCheckbox
  // We call both hooks unconditionally to satisfy React's rules, but only use the appropriate one
  const standaloneResult = useCheckbox(
    {
      ...checkboxProps,
      isDisabled,
      isReadOnly,
    },
    standaloneState,
    ref,
  )

  // useCheckboxGroupItem requires CheckboxGroupState and value to be defined
  // When not in a group, we pass standaloneState as a fallback (won't be used)
  const groupResult = useCheckboxGroupItem(
    {
      ...checkboxProps,
      value: checkboxProps.value ?? "",
      isDisabled,
      isReadOnly,
    },
    (groupContext?.state ?? standaloneState) as CheckboxGroupState,
    ref,
  )

  // Use the appropriate result based on context
  const { inputProps, isPressed, isSelected } = isInGroup
    ? groupResult
    : standaloneResult

  const { focusProps, isFocusVisible } = useFocusRing()
  const mergedInputProps = mergeProps(inputProps, focusProps)

  const isInvalid = checkboxProps.isInvalid ?? false
  const isIndeterminate = checkboxProps.isIndeterminate ?? false

  return (
    <label
      className={twMerge(
        checkboxStyles({ isDisabled: !!isDisabled }),
        className,
      )}
    >
      <input
        {...mergedInputProps}
        ref={ref}
        type="checkbox"
        className="sr-only"
      />
      <div
        // Used to align icon with text
        className="flex items-center justify-center before:invisible before:w-0 before:content-['hidden']"
      >
        <div
          className={boxStyles({
            isSelected: isSelected || isIndeterminate,
            isInvalid,
            isDisabled: !!isDisabled,
            isFocusVisible,
          })}
          data-pressed={isPressed || undefined}
        >
          {isIndeterminate ? (
            <BiMinus aria-hidden className={iconStyles} />
          ) : isSelected ? (
            <BiCheck aria-hidden className={iconStyles} />
          ) : null}
        </div>
      </div>
      {children}
    </label>
  )
}
