"use client"

import type { AriaButtonProps } from "@react-aria/button"
import { useButton } from "@react-aria/button"
import { useRef, type ReactNode } from "react"
import { tv } from "~/lib/tv"

const calendarActionButtonStyles = tv({
  base: "prose-label-sm-medium rounded px-4 py-2.5 outline-0",
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

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={calendarActionButtonStyles({ variant })}
    >
      {children}
    </button>
  )
}
