"use client"

import type { AriaButtonProps } from "@react-aria/button"
import type { IconType } from "react-icons"
import type { VariantProps } from "tailwind-variants"
import type { SetRequired } from "type-fest"
import { forwardRef, useRef } from "react"
import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils"
import { mergeRefs } from "~/utils/rac"

const iconButtonStyles = tv({
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

const iconButtonIconStyles = tv({
  base: "h-6 w-6",
})

interface IconButtonProps
  extends
    SetRequired<Omit<AriaButtonProps<"button">, "children">, "aria-label">,
    VariantProps<typeof iconButtonStyles> {
  icon: IconType
  className?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon: Icon, className, variant, size, colorScheme, isDisabled, ...props },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const { buttonProps } = useButton({ ...props, isDisabled }, buttonRef)
    const { focusProps, isFocusVisible } = useFocusRing()

    const mergedProps = mergeProps(buttonProps, focusProps)

    return (
      <button
        {...mergedProps}
        ref={mergeRefs(buttonRef, ref)}
        className={twMerge(
          iconButtonStyles({
            isFocusVisible,
            isDisabled,
            variant,
            size,
            colorScheme,
          }),
          className,
        )}
      >
        <Icon className={iconButtonIconStyles()} />
      </button>
    )
  },
)
