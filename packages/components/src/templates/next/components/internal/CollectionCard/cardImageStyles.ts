import { tv } from "~/lib/tv"

export const cardImageStyles = tv({
  base: "absolute left-0 h-full w-full rounded object-cover",
  variants: {
    contain: {
      true: "object-contain",
    },
  },
})
