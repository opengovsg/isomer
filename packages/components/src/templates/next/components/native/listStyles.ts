import { tv } from "~/lib/tv"

export const listStyles = tv({
  base: "mt-6 ps-9 marker:text-base-content",
  variants: {
    isNested: {
      true: "mt-3",
    },
  },
})
