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
import { createContext, useContext, useRef } from "react"
import { BiCheck, BiMinus } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils/tailwind"

interface CheckboxGroupContextValue {
  state: CheckboxGroupState
  isDisabled?: boolean
  isReadOnly?: boolean
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
)

interface CheckboxGroupProps extends AriaCheckboxGroupProps {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string
  className?: string
}

export const CheckboxGroup = (props: CheckboxGroupProps) => {
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

  const contextValue = {
    state,
    isDisabled: groupProps.isDisabled,
    isReadOnly: groupProps.isReadOnly,
  }

  return (
    // oxlint-disable-next-line react/jsx-no-constructed-context-values -- RAC group state must stay in sync with hooks
    <CheckboxGroupContext.Provider value={contextValue}>
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

interface CheckboxProps extends AriaCheckboxProps {
  children?: ReactNode
  className?: string
}

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

// oxlint-disable-next-line react-doctor/no-many-boolean-props -- RAC checkbox state flags map to visual variants
const CheckboxRenderer = ({
  children,
  className,
  inputProps,
  inputRef,
  isDisabled,
  isInvalid,
  isIndeterminate,
  isSelected,
}: CheckboxRenderProps) => {
  const labelRef = useRef<HTMLLabelElement>(null)
  const { focusProps, isFocusVisible } = useFocusRing()
  const mergedInputProps = mergeProps(inputProps, focusProps)

  const { pressProps, isPressed } = usePress({
    isDisabled,
    onPress: () => {
      if (!isDisabled) {
        inputRef.current?.click()
      }
    },
  })

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
      data-selected={isSelected || isIndeterminate ? "true" : undefined}
    >
      <input
        {...mergedInputProps}
        ref={inputRef}
        type="checkbox"
        checked={isSelected || isIndeterminate}
        readOnly
        className="sr-only"
      />
      <div
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

const StandaloneCheckbox = (props: CheckboxProps) => {
  const { children, className, ...checkboxProps } = props
  const ref = useRef<HTMLInputElement>(null)
  const state = useToggleState(checkboxProps)
  const { inputProps } = useCheckbox(checkboxProps, state, ref)

  return (
    <CheckboxRenderer
      className={className}
      inputProps={inputProps}
      inputRef={ref}
      isDisabled={checkboxProps.isDisabled ?? false}
      isInvalid={checkboxProps.isInvalid ?? false}
      isIndeterminate={checkboxProps.isIndeterminate ?? false}
      isSelected={state.isSelected}
    >
      {children}
    </CheckboxRenderer>
  )
}

const GroupedCheckbox = (props: CheckboxProps) => {
  const { children, className, ...checkboxProps } = props
  const groupContext = useContext(CheckboxGroupContext)
  const ref = useRef<HTMLInputElement>(null)

  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
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
      className={className}
      inputProps={inputProps}
      inputRef={ref}
      isDisabled={isDisabled}
      isInvalid={checkboxProps.isInvalid ?? false}
      isIndeterminate={checkboxProps.isIndeterminate ?? false}
      isSelected={state.isSelected(checkboxProps.value ?? "")}
    >
      {children}
    </CheckboxRenderer>
  )
}

export const Checkbox = (props: CheckboxProps) => {
  const groupContext = useContext(CheckboxGroupContext)
  const isInGroup = groupContext !== null && props.value !== undefined

  if (isInGroup) {
    return <GroupedCheckbox {...props} />
  }

  return <StandaloneCheckbox {...props} />
}
