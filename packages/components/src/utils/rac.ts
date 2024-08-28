// react-aria-component utils

import { composeRenderProps } from "react-aria-components"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

/**
 * Helper type that converts Classnames<"container" | "icon"> to Partial<{ container: string; icon: string; }>
 * Useful for allowing consumers to pass in custom classnames for specific parts of a component.
 */
export type ClassNames<T extends string> = Partial<Record<T, string>>

export function composeTailwindRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tw: string,
): string | ((v: T) => string) {
  return composeRenderProps(className, (className) => twMerge(tw, className))
}

/**
 * Function to return undefined if the value is falsy, otherwise true
 */
export const dataAttr = (value: unknown) => (!!value ? true : undefined)

// TODO: move focusRing style inside here
export const focusVisibleHighlight = tv({
  base: "",
  variants: {
    isFocusVisible: {
      true: "shadow-focus-visible bg-utility-highlight text-base-content-strong decoration-transparent outline-0 transition-none hover:decoration-transparent",
    },
  },
})

export const focusVisibleHighlightNonRac = tv({
  base: "focus-visible:shadow-focus-visible focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:decoration-transparent focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent",
})

export const groupFocusVisibleHighlightNonRac = tv({
  base: "group-focus-visible:shadow-focus-visible group-focus-visible:bg-utility-highlight group-focus-visible:text-base-content-strong group-focus-visible:decoration-transparent group-focus-visible:outline-0 group-focus-visible:transition-none group-focus-visible:hover:decoration-transparent",
})
