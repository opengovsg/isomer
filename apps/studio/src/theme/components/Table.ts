import type { SystemStyleObject } from "@chakra-ui/react"
import { tableAnatomy } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers } from "@chakra-ui/react"

import { textStyles } from "../foundations/textStyles"

const parts = tableAnatomy.extend("container")

// eslint-disable-next-line @typescript-eslint/unbound-method
const { defineMultiStyleConfig, definePartsStyle } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  tr: {
    pos: "relative",
    textStyle: "body-2",
    _last: {
      borderBottomWidth: 0,
    },
  },
})

const sizes = {
  md: definePartsStyle({
    container: {
      p: "0.75rem",
    },
    th: {
      py: "0.625rem",
      minH: "1.5rem",
      ...textStyles["body-2"],
    },
    td: {
      p: "1rem",
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

const variantSubtle = definePartsStyle(() => {
  return {
    container: {
      bg: "white",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: "base.divider.medium",
    },
    table: {
      bg: "white",
    },
    thead: {
      opacity: 1,
      zIndex: 1,
    },
    th: getSubtleVariantThStyles(),
    td: {
      color: "base.content.default",
    },
  }
})

const variants = {
  subtle: variantSubtle,
}

export const Table = defineMultiStyleConfig({
  baseStyle,
  variants,
  defaultProps: {
    variant: "subtle",
    size: "md",
    colorScheme: "neutral",
  },
  sizes,
})
