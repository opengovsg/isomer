// react-aria-component utils

/**
 * Helper type that converts Classnames<"container" | "icon"> to Partial<{ container: string; icon: string; }>
 * Useful for allowing consumers to pass in custom classnames for specific parts of a component.
 */
export type ClassNames<T extends string> = Partial<Record<T, string>>

/**
 * Function to return undefined if the value is falsy, otherwise true
 */
export const dataAttr = (value: unknown) => (!!value ? true : undefined)

export const mergeRefs = <T>(
  internalRef: React.MutableRefObject<T | null>,
  forwardedRef: React.ForwardedRef<T>,
) => {
  return (node: T | null) => {
    internalRef.current = node
    if (typeof forwardedRef === "function") {
      forwardedRef(node)
    } else if (forwardedRef) {
      forwardedRef.current = node
    }
  }
}
