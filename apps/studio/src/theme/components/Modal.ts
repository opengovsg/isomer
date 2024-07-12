import { modalAnatomy as parts } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react"

// eslint-disable-next-line @typescript-eslint/unbound-method
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyleDialog = defineStyle((props) => {
  const { scrollBehavior } = props
  return {
    // Overriding default design system's margins to be app-specific
    my: "4rem",
    maxH: scrollBehavior === "inside" ? "calc(100% - 8rem)" : undefined,
  }
})

const baseStyle = definePartsStyle((props) => ({
  dialog: baseStyleDialog(props),
}))

const sizes = {
  md: definePartsStyle(() => {
    return {
      header: {
        pl: "2rem",
        pr: "5rem", // accommodate close button
      },
    }
  }),
  full: definePartsStyle(() => {
    return {
      header: {
        p: "1.5rem",
        pr: "5rem", // accommodate close button
      },
    }
  }),
}

export const Modal = defineMultiStyleConfig({
  baseStyle,
  sizes,
})
