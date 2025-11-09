"use client"

import type { AriaButtonProps } from "@react-aria/button"
import type { VariantProps } from "tailwind-variants"
import { forwardRef, useRef } from "react"
import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"

import { twMerge } from "~/lib/twMerge"
import { mergeRefs } from "~/utils/rac"
import { buttonStyles } from "./common"

export interface ButtonProps
  extends AriaButtonProps<"button">,
    VariantProps<typeof buttonStyles> {
  className?: string
}

/**
 * You probaby do not want to use this component if you are rendering a link.
 * Use `LinkButton` component instead.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, colorScheme, size, isDisabled, children, ...props },
    ref,
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null)
    const { buttonProps } = useButton({ ...props, isDisabled }, internalRef)
    const { focusProps, isFocusVisible } = useFocusRing()

    const mergedProps = mergeProps(buttonProps, focusProps)

    return (
      <button
        {...mergedProps}
        ref={mergeRefs(internalRef, ref)}
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
