// react-aria-component utils

import { composeRenderProps } from "react-aria-components"

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
