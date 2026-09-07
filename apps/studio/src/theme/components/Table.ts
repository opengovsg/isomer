import type { SystemStyleObject } from "@chakra-ui/react"
import { tableAnatomy } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers } from "@chakra-ui/react"

import { textStyles } from "../foundations/textStyles"

const parts = tableAnatomy.extend("container")

const { defineMultiStyleConfig, definePartsStyle } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  tr: {
    _last: {
      borderBottomWidth: 0,
    },
    pos: "relative",
    textStyle: "body-2",
  },
})

const sizes = {
  md: definePartsStyle({
    container: {
      p: "0.75rem",
    },
    td: {
      px: "1rem",
      py: "0.5rem",
    },
    th: {
      minH: "1.5rem",
      py: "0.625rem",
      ...textStyles["body-2"],
    },
  }),
}

const getSubtleVariantThStyles = (): SystemStyleObject => {
  const baseStyles: SystemStyleObject = {
    color: "base.content.medium",
    textTransform: "initial",
  }

  return {
    color: "base.content.medium",
    ...baseStyles,
  }
}

const variantSubtle = definePartsStyle(() => ({
  container: {
    bg: "white",
    border: "1px solid",
    borderColor: "base.divider.medium",
    borderRadius: "8px",
  },
  table: {
    bg: "white",
  },
  td: {
    color: "base.content.default",
  },
  th: getSubtleVariantThStyles(),
  thead: {
    opacity: 1,
    zIndex: 1,
  },
}))

const variants = {
  subtle: variantSubtle,
}

export const Table = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    colorScheme: "neutral",
    size: "md",
    variant: "subtle",
  },
  sizes,
  variants,
})
