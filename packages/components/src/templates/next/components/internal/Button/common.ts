import { tv } from "~/lib/tv"

export const buttonIconStyles = tv({
  base: "h-auto flex-shrink-0",
  variants: {
    size: {
      sm: "w-3.5 lg:w-4",
      base: "w-3.5 lg:w-4",
      lg: "w-4.5 lg:w-5",
    },
  },
  defaultVariants: {
    size: "base",
  },
})
