"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { forwardRef } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"

import { buttonStyles } from "./common"

export interface ButtonProps
  extends AriaButtonProps,
    VariantProps<typeof buttonStyles> {}

/**
 * You probaby do not want to use this component if you are rendering a link.
 * Use `LinkButton` component instead.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, colorScheme, size, ...props }, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        className={composeRenderProps(className, (className, renderProps) =>
          buttonStyles({
            ...renderProps,
            variant,
            size,
            className,
            colorScheme,
          }),
        )}
      />
    )
  },
)
Button.displayName = "Button"
