"use client"

import type { AriaTextFieldOptions } from "@react-aria/textfield"
import { useRef, useState } from "react"
import { useFocusRing } from "@react-aria/focus"
import { useTextField } from "@react-aria/textfield"
import { mergeProps } from "@react-aria/utils"
import { BiSearch, BiX } from "react-icons/bi"

import type { ClassNames } from "~/utils/rac"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { IconButton } from "./IconButton"

const inputStyles = tv({
  base: "prose-body-base min-w-0 flex-1 bg-white text-base-content outline outline-0 placeholder:text-interaction-support-placeholder disabled:text-interaction-support-placeholder",
})

const fieldGroupStyles = tv({
  base: "group flex items-center gap-4 overflow-hidden rounded bg-white py-1 pl-4 shadow-[0_0_0_1.5px] forced-colors:bg-[Field]",
  variants: {
    isFocusWithin: {
      false: "shadow-brand-interaction forced-colors:border-[ButtonBorder]",
      true: "bg-interaction-main-subtle-hover shadow-[0_0_0_2px] shadow-utility-feedback-info",
    },
    isInvalid: {
      true: "border-red-600 forced-colors:border-[Mark]",
    },
    isDisabled: {
      true: "border-gray-200 forced-colors:border-[GrayText]",
    },
  },
})

interface SearchFieldProps extends AriaTextFieldOptions<"input"> {
  placeholder?: string
  classNames?: ClassNames<
    | "container"
    | "fieldgroup"
    | "label"
    | "input"
    | "submit"
    | "reset"
    | "description"
    | "error"
  >
}

export function SearchField({
  classNames,
  placeholder,
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const { inputProps } = useTextField(props, inputRef)
  const { focusProps } = useFocusRing()

  const isDisabled = props.isDisabled ?? false
  const isInvalid = props.isInvalid ?? false
  const value = typeof inputProps.value === "string" ? inputProps.value : ""
  const isEmpty = !value || value.length === 0

  const handleClear = () => {
    if (props.onChange) {
      props.onChange("")
    }
    inputRef.current?.focus()
  }

  return (
    <div className={twMerge("flex flex-col gap-2", classNames?.container)}>
      <div
        className={twMerge(
          fieldGroupStyles({
            isFocusWithin,
            isInvalid,
            isDisabled,
          }),
          classNames?.fieldgroup,
        )}
        onFocus={() => setIsFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocusWithin(false)
          }
        }}
      >
        <BiSearch
          aria-hidden
          className={
            isDisabled
              ? "h-5 w-5 text-base-content-medium forced-colors:text-[GrayText]"
              : "h-5 w-5 text-base-content-medium forced-colors:text-[ButtonText]"
          }
        />
        <input
          {...mergeProps(inputProps, focusProps)}
          ref={inputRef}
          type="search"
          className={twMerge(
            inputStyles(),
            "bg-transparent [&::-webkit-search-cancel-button]:hidden",
            classNames?.input,
          )}
          placeholder={placeholder}
        />
        <IconButton
          icon={BiX}
          onPress={handleClear}
          className={twMerge(isEmpty && "invisible", classNames?.reset)}
          aria-label="Clear search field"
        />
      </div>
    </div>
  )
}
