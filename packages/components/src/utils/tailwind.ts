import { tv } from "~/lib/tv"

export const focusVisibleHighlight = tv({
  base: "focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:shadow-focus-visible focus-visible:decoration-transparent focus-visible:outline-0 focus-visible:transition-none focus-visible:hover:decoration-transparent",
})

export const groupFocusVisibleHighlight = tv({
  base: "group-focus-visible:bg-utility-highlight group-focus-visible:text-base-content-strong group-focus-visible:shadow-focus-visible group-focus-visible:decoration-transparent group-focus-visible:outline-0 group-focus-visible:transition-none group-focus-visible:hover:decoration-transparent",
})

export const focusRing = tv({
  base: "outline-link outline outline-offset-2",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
})
