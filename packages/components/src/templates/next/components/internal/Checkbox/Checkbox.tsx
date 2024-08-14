"use client"

import type { ReactNode } from "react"
import type {
  CheckboxGroupProps as AriaCheckboxGroupProps,
  CheckboxProps,
  ValidationResult,
} from "react-aria-components"
import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  composeRenderProps,
} from "react-aria-components"
import { BiCheck, BiMinus } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/focusRing"
import { composeTailwindRenderProps } from "~/utils/rac"

export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, "children"> {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-4",
      )}
    />
  )
}

const checkboxStyles = tv({
  base: "group prose-body-base flex items-center gap-3 transition",
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

export function Checkbox(props: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        checkboxStyles({ ...renderProps, className }),
      )}
    >
      {({ isSelected, isIndeterminate, ...renderProps }) => (
        <>
          <div
            className={boxStyles({
              isSelected: isSelected || isIndeterminate,
              ...renderProps,
            })}
          >
            {isIndeterminate ? (
              <BiMinus aria-hidden className={iconStyles} />
            ) : isSelected ? (
              <BiCheck aria-hidden className={iconStyles} />
            ) : null}
          </div>
          {props.children}
        </>
      )}
    </AriaCheckbox>
  )
}
