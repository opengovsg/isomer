"use client"

import type { AriaButtonProps } from "@react-aria/button"
import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { useRef, type ReactNode } from "react"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/tailwind"

const calendarActionButtonStyles = tv({
  extend: focusRing,
  base: "prose-label-sm-medium rounded px-4 py-2.5",
  variants: {
    variant: {
      apply: "bg-brand-canvas-inverse text-base-content-inverse",
      clear: "bg-white text-base-content",
    },
  },
})

interface CalendarActionButtonProps extends AriaButtonProps<"button"> {
  variant: "apply" | "clear"
  children: ReactNode
}

export const CalendarActionButton = ({
  variant,
  children,
  ...props
}: CalendarActionButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)
  const { focusProps, isFocusVisible } = useFocusRing()

  return (
    <button
      {...mergeProps(buttonProps, focusProps)}
      ref={ref}
      type="button"
      className={calendarActionButtonStyles({ variant, isFocusVisible })}
    >
      {children}
    </button>
  )
}
