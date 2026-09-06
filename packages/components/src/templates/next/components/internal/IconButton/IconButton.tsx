"use client"

import type { AriaButtonProps } from "@react-aria/button"
import type { IconType } from "react-icons"
import type { VariantProps } from "tailwind-variants"
import type { SetRequired } from "type-fest"
import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { forwardRef, useRef } from "react"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { mergeRefs } from "~/utils/rac"
import { focusRing } from "~/utils/tailwind"

const iconButtonStyles = tv({
  base: "box-border flex w-fit cursor-pointer items-center justify-center rounded text-center transition",
  compoundVariants: [
    {
      className: "text-base-content",
      colorScheme: "default",
      variant: "clear",
    },
    {
      className:
        "bg-utility-highlight text-base-content-strong transition-none",
      isFocusVisible: true,
      variant: "clear",
    },
  ],
  defaultVariants: {
    colorScheme: "default",
    size: "base",
    variant: "clear",
  },
  extend: focusRing,
  variants: {
    colorScheme: {
      default: "",
    },
    isDisabled: {
      true: "cursor-not-allowed",
    },
    size: {
      base: "h-12 w-12 p-2",
    },
    variant: {
      clear:
        "bg-transparent active:bg-base-canvas-backdrop/80 hover:bg-base-canvas-backdrop/50",
    },
  },
})

const iconButtonIconStyles = tv({
  base: "h-6 w-6",
})

interface IconButtonProps
  extends
    SetRequired<Omit<AriaButtonProps, "children">, "aria-label">,
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
        type="button"
        {...mergedProps}
        ref={mergeRefs(buttonRef, ref)}
        className={twMerge(
          iconButtonStyles({
            colorScheme,
            isDisabled,
            isFocusVisible,
            size,
            variant,
          }),
          className,
        )}
      >
        <Icon className={iconButtonIconStyles()} />
      </button>
    )
  },
)
IconButton.displayName = "IconButton"
