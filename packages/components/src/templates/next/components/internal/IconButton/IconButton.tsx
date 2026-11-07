"use client"

import type { AriaButtonProps } from "@react-aria/button"
import type { IconType } from "react-icons"
import type { VariantProps } from "tailwind-variants"
import type { SetRequired } from "type-fest"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { forwardRef } from "react"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing } from "~/utils/tailwind"

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
    SetRequired<
      Omit<AriaButtonProps<"button">, "children" | "onPress">,
      "aria-label"
    >,
    VariantProps<typeof iconButtonStyles> {
  icon: IconType
  className?: string
  onPress?: () => void
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      className,
      variant,
      size,
      colorScheme,
      isDisabled,
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
