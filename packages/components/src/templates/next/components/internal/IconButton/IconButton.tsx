"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { IconType } from "react-icons"
import type { VariantProps } from "tailwind-variants"
import type { SetRequired } from "type-fest"
import { forwardRef } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"
import { tv } from "tailwind-variants"

import { focusRing } from "~/utils/focusRing"

export const iconButtonStyles = tv({
  base: "box-border w-fit cursor-pointer rounded text-center transition",
  extend: focusRing,
  variants: {
    variant: {
      clear:
        "bg-transparent hover:bg-base-canvas-backdrop/50 active:bg-base-canvas-backdrop/80",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    colorScheme: {
      default: "",
    },
    size: {
      base: "flex h-12 w-12 items-center justify-center p-2",
    },
  },
  compoundVariants: [
    {
      variant: "clear",
      colorScheme: "default",
      className: "text-base-content",
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
