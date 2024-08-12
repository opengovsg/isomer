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
import { focusRing } from "~/utils/focusRing"
import { composeTailwindRenderProps } from "~/utils/rac"
import { IconButton } from "./IconButton"
import { Input } from "./Input"

const fieldGroupStyles = tv({
  extend: focusRing,
  base: "group flex items-center gap-4 overflow-hidden rounded border bg-white py-1 pl-4 forced-colors:bg-[Field]",
  variants: {
    isFocusWithin: {
      false:
        "m-[1px] border-base-divider-medium forced-colors:border-[ButtonBorder]",
      true: "outline-utility-focus-default border-2 border-utility-feedback-info bg-interaction-main-subtle-hover outline forced-colors:border-[Highlight]",
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
        "group flex min-w-[40px] flex-col gap-2",
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
