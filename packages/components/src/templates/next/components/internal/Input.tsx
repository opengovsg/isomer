"use client"

import type { AriaTextFieldOptions } from "@react-aria/textfield"
import { useRef } from "react"
import { useTextField } from "@react-aria/textfield"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

export const inputStyles = tv({
  base: "prose-body-base min-w-0 flex-1 bg-white text-base-content outline outline-0 placeholder:text-interaction-support-placeholder disabled:text-interaction-support-placeholder",
})

export interface InputProps extends AriaTextFieldOptions<"input"> {
  className?: string
}

export function Input(props: InputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const { className, ...textFieldProps } = props
  const { inputProps } = useTextField(textFieldProps, ref)

  return (
    <input
      {...inputProps}
      ref={ref}
      className={twMerge(inputStyles(), className)}
    />
  )
}
