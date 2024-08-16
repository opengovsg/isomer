"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { forwardRef } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"

import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/focusRing"

export const buttonStyles = tv({
  base: "box-border block h-full w-fit cursor-pointer rounded text-center transition",
  extend: focusRing,
  variants: {
    variant: {
      solid: "",
      outline: "",
      clear: "",
    },
    colorScheme: {
      default: "",
      inverse: "",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    size: {
      base: "prose-headline-base-medium min-h-12 px-5 py-3",
      lg: "prose-headline-lg-medium min-h-[3.25rem] px-6 py-3.5",
    },
  },
  compoundVariants: [
    {
      variant: "solid",
      colorScheme: "default",
      className:
        "bg-brand-canvas-inverse text-base-content-inverse active:bg-brand-interaction-pressed hover:bg-brand-interaction-hover",
    },
    {
      variant: "solid",
      colorScheme: "inverse",
      className: "bg-base-canvas text-base-content",
    },
    {
      variant: "outline",
      colorScheme: "inverse",
      className:
        "border border-base-divider-inverse text-base-content-inverse hover:bg-base-canvas-inverse-overlay/80",
    },
    {
      variant: "outline",
      colorScheme: "default",
      className: "border border-brand-canvas-inverse text-brand-canvas-inverse",
    },
    {
      variant: "outline",
      size: "lg",
      // -1 px for border
      className: "px-[23px] py-[13px]",
    },
    {
      variant: "outline",
      size: "base",
      // -1 px for border
      className: "px-[19px] py-[11px]",
    },
  ],
  defaultVariants: {
    variant: "solid",
    colorScheme: "default",
    size: "base",
  },
})

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
