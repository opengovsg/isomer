"use client"

import type {
  AriaCheckboxGroupProps,
  AriaCheckboxProps,
} from "@react-aria/checkbox"
import type { CheckboxGroupState } from "@react-stately/checkbox"
import type {
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
  RefObject,
} from "react"
import { createContext, useContext, useRef } from "react"
import {
  useCheckbox,
  useCheckboxGroup,
  useCheckboxGroupItem,
} from "@react-aria/checkbox"
import { useFocusRing } from "@react-aria/focus"
import { usePress } from "@react-aria/interactions"
import { mergeProps } from "@react-aria/utils"
import { useCheckboxGroupState } from "@react-stately/checkbox"
import { useToggleState } from "@react-stately/toggle"
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
        "border-[--color] bg-white [--color:theme(colors.base.divider.medium)] group-data-[pressed]:[--color:theme(colors.base.divider.strong)]",
      true: "border-[--color] bg-[--color] [--color:theme(colors.brand.interaction.DEFAULT)] group-data-[pressed]:[--color:theme(colors.brand.interaction.pressed)] forced-colors:![--color:Highlight]",
    },
    isInvalid: {
      true: "[--color:theme(colors.red.700)] group-data-[pressed]:[--color:theme(colors.red.800)] forced-colors:![--color:Mark]",
    },
    isDisabled: {
      true: "[--color:theme(colors.gray.200)] forced-colors:![--color:GrayText]",
    },
  },
})

const iconStyles =
  "w-4 h-4 text-white group-disabled:text-gray-400 forced-colors:text-[HighlightText]"

export interface CheckboxProps extends AriaCheckboxProps {
  children?: ReactNode
  className?: string
}

// Shared props for checkbox rendering
interface CheckboxRenderProps {
  children?: ReactNode
  className?: string
  inputProps: InputHTMLAttributes<HTMLInputElement>
  inputRef: RefObject<HTMLInputElement>
  isDisabled: boolean
  isInvalid: boolean
  isIndeterminate: boolean
  isSelected: boolean
}

// Shared rendering component for both standalone and grouped checkboxes
function CheckboxRenderer({
  children,
  className,
  inputProps,
  inputRef,
  isDisabled,
  isInvalid,
  isIndeterminate,
  isSelected,
}: CheckboxRenderProps) {
  const labelRef = useRef<HTMLLabelElement>(null)
  const { focusProps, isFocusVisible } = useFocusRing()
  const mergedInputProps = mergeProps(inputProps, focusProps)

  // usePress handles both mouse and keyboard interactions
  // For keyboard: onPress will be called (Enter/Space)
  // For mouse: we prevent default to avoid double toggling, then onPress handles it
  const { pressProps, isPressed } = usePress({
    isDisabled,
    onPress: () => {
      if (!isDisabled) {
        inputRef.current?.click()
      }
    },
  })

  // Prevent native label click to avoid double toggling with mouse
  // Keyboard events are handled by usePress's onPress
  const labelProps = mergeProps(pressProps, {
    onClick: (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
  })

  return (
    <label
      ref={labelRef}
      {...labelProps}
      className={twMerge(
        checkboxStyles({ isDisabled: !!isDisabled }),
        className,
      )}
      data-pressed={isPressed ? "true" : undefined}
    >
      <input
        {...mergedInputProps}
        ref={inputRef}
        type="checkbox"
        checked={isSelected || isIndeterminate}
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

// Internal component for standalone checkboxes
function StandaloneCheckbox(props: CheckboxProps) {
  const { children, className, ...checkboxProps } = props
  const ref = useRef<HTMLInputElement>(null)
  const state = useToggleState(checkboxProps)
  const { inputProps } = useCheckbox(checkboxProps, state, ref)

  return (
    <CheckboxRenderer
      children={children}
      className={className}
      inputProps={inputProps}
      inputRef={ref}
      isDisabled={checkboxProps.isDisabled ?? false}
      isInvalid={checkboxProps.isInvalid ?? false}
      isIndeterminate={checkboxProps.isIndeterminate ?? false}
      isSelected={state.isSelected}
    />
  )
}

// Internal component for grouped checkboxes
// This component is only rendered when isInGroup is true, so groupContext is guaranteed to exist
function GroupedCheckbox(props: CheckboxProps) {
  const { children, className, ...checkboxProps } = props
  const groupContext = useContext(CheckboxGroupContext)
  const ref = useRef<HTMLInputElement>(null)

  // groupContext is guaranteed to exist because this component is only rendered when isInGroup is true
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const context = groupContext!
  const state = context.state

  const isDisabled = checkboxProps.isDisabled ?? context.isDisabled ?? false
  const isReadOnly = checkboxProps.isReadOnly ?? context.isReadOnly ?? false

  const { inputProps } = useCheckboxGroupItem(
    {
      ...checkboxProps,
      value: checkboxProps.value ?? "",
      isDisabled,
      isReadOnly,
    },
    state,
    ref,
  )

  return (
    <CheckboxRenderer
      children={children}
      className={className}
      inputProps={inputProps}
      inputRef={ref}
      isDisabled={isDisabled}
      isInvalid={checkboxProps.isInvalid ?? false}
      isIndeterminate={checkboxProps.isIndeterminate ?? false}
      isSelected={state.isSelected(checkboxProps.value ?? "")}
    />
  )
}

export function Checkbox(props: CheckboxProps) {
  const groupContext = useContext(CheckboxGroupContext)
  const isInGroup = groupContext !== null && props.value !== undefined

  // Conditionally render the appropriate component
  // This allows us to only call useCheckboxGroupItem when actually in a group
  if (isInGroup) {
    return <GroupedCheckbox {...props} />
  }

  return <StandaloneCheckbox {...props} />
}
