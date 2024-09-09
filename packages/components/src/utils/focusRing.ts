import { tv } from "~/lib/tv"

export const focusRing = tv({
  base: "outline outline-offset-2 outline-link",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
})
