// react-aria-component utils

import { tv } from "~/lib/tv"

/**
 * Helper type that converts Classnames<"container" | "icon"> to Partial<{ container: string; icon: string; }>
 * Useful for allowing consumers to pass in custom classnames for specific parts of a component.
 */
export type ClassNames<T extends string> = Partial<Record<T, string>>

/**
 * Function to return undefined if the value is falsy, otherwise true
 */
export const dataAttr = (
  value: string | number | boolean | null | undefined,
): true | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === false ||
    value === ""
  ) {
    return undefined
  }

  return true
}

// Move focusRing style inside here when consolidating RAC utilities.
export const focusVisibleHighlight = tv({
  base: "",
  variants: {
    isFocusVisible: {
      true: "bg-utility-highlight text-base-content-strong decoration-transparent shadow-focus-visible outline-0 transition-none hover:decoration-transparent",
    },
  },
})

const isCallbackRef = <T>(
  ref: React.ForwardedRef<T>,
): ref is (node: T | null) => void => typeof ref === "function"

export const mergeRefs = <T>(
  internalRef: React.MutableRefObject<T | null>,
  forwardedRef: React.ForwardedRef<T>,
) =>
  (node: T | null) => {
    internalRef.current = node
    if (isCallbackRef(forwardedRef)) {
      forwardedRef(node)
    } else if (forwardedRef !== null && "current" in forwardedRef) {
      forwardedRef.current = node
    }
  }
