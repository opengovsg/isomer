"use client"

import type {
  SearchFieldProps as AriaSearchFieldProps,
  GroupProps,
} from "react-aria-components"
import {
  SearchField as AriaSearchField,
  composeRenderProps,
  Group,
} from "react-aria-components"
import { BiSearch, BiX } from "react-icons/bi"

import type { ClassNames } from "~/utils/rac"
import { tv } from "~/lib/tv"
import { composeTailwindRenderProps } from "~/utils/rac"
import { IconButton } from "./IconButton"
import { Input } from "./Input"

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

function FieldGroup(props: GroupProps) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className }),
      )}
    />
  )
}

export interface SearchFieldProps
  extends Omit<AriaSearchFieldProps, "className"> {
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
  return (
    <AriaSearchField
      {...props}
      className={composeTailwindRenderProps(
        classNames?.container,
        "group flex flex-col gap-2",
      )}
    >
      <FieldGroup className={classNames?.fieldgroup}>
        <BiSearch
          aria-hidden
          className="h-5 w-5 text-base-content-medium forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]"
        />
        <Input
          className={composeTailwindRenderProps(
            classNames?.input,
            "bg-transparent [&::-webkit-search-cancel-button]:hidden",
          )}
          placeholder={placeholder}
        />
        <IconButton
          icon={BiX}
          className="group-empty:invisible"
          aria-label="Clear search field"
        />
      </FieldGroup>
    </AriaSearchField>
  )
}
