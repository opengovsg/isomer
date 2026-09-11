import { tv } from "~/lib/tv"

export const filterPanelStyles = tv({
  base: "hidden",
  variants: {
    isOpen: {
      true: "flex flex-col",
    },
  },
})

export const filterChevronStyles = tv({
  base: "h-6 w-6 flex-shrink-0 text-base-content-strong transition-all duration-300 ease-in-out",
  variants: {
    isOpen: {
      true: "rotate-180",
    },
  },
})
