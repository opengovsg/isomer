"use client"

import type { ComponentPropsWithoutRef } from "react"
import type { VariantProps } from "tailwind-variants"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { forwardRef } from "react"
import { twMerge } from "~/lib/twMerge"

import { buttonStyles } from "./common"

export interface ButtonProps
  extends
    Omit<ComponentPropsWithoutRef<"button">, "disabled">,
    VariantProps<typeof buttonStyles> {
  isDisabled?: boolean
  onPress?: () => void
}

/**
 * You probaby do not want to use this component if you are rendering a link.
 * Use `LinkButton` component instead.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      colorScheme,
      size,
      isDisabled,
      children,
      onPress,
      onClick,
      type,
      ...props
    },
    ref,
  ) => {
    const { focusProps, isFocusVisible } = useFocusRing()

    return (
      <button
        {...mergeProps(focusProps, props)}
        type={type ?? "button"}
        disabled={isDisabled}
        onClick={(event) => {
          onClick?.(event)
          onPress?.()
        }}
        ref={ref}
        className={twMerge(
          buttonStyles({
            isFocusVisible,
            isDisabled,
            variant,
            size,
            colorScheme,
          }),
          className,
        )}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"
