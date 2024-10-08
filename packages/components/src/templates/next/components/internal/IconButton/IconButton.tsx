"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { IconType } from "react-icons"
import type { VariantProps } from "tailwind-variants"
import type { SetRequired } from "type-fest"
import { forwardRef } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"

import { tv } from "~/lib/tv"
import { focusRing } from "~/utils"

export const iconButtonStyles = tv({
  base: "box-border flex w-fit cursor-pointer items-center justify-center rounded text-center transition",
  extend: focusRing,
  variants: {
    variant: {
      clear:
        "bg-transparent active:bg-base-canvas-backdrop/80 hover:bg-base-canvas-backdrop/50",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    colorScheme: {
      default: "",
    },
    size: {
      base: "h-12 w-12 p-2",
    },
  },
  compoundVariants: [
    {
      variant: "clear",
      colorScheme: "default",
      className: "text-base-content",
    },
    {
      variant: "clear",
      isFocusVisible: true,
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
    },
  ],
  defaultVariants: {
    size: "base",
    variant: "clear",
    colorScheme: "default",
  },
})

export const iconButtonIconStyles = tv({
  base: "h-6 w-6",
})

export interface IconButtonProps
  extends SetRequired<Omit<AriaButtonProps, "children">, "aria-label">,
    VariantProps<typeof iconButtonStyles> {
  icon: IconType
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, className, variant, size, colorScheme, ...props }, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        className={composeRenderProps(className, (className, renderProps) =>
          iconButtonStyles({
            ...renderProps,
            variant,
            size,
            className,
            colorScheme,
          }),
        )}
      >
        <Icon className={iconButtonIconStyles()} />
      </AriaButton>
    )
  },
)
