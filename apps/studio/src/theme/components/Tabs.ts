import { tabsAnatomy as parts } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers } from "@chakra-ui/react"

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const groupVariant = definePartsStyle(() => ({
  tab: {
    border: "1px solid",
    borderColor: "base.divider.strong",
    bgColor: "utility.ui",
    px: "1rem",
    py: "0.5rem",
    mx: 0,
    _first: {
      borderLeftRadius: "base",
    },
    _last: {
      borderRightRadius: "base",
    },
    _selected: {
      bgColor: "interaction.muted.main.active",
      color: "interaction.main.default",
      borderColor: "interaction.main.default",
    },
    textTransform: "none",
    fontWeight: 500,
    lineHeight: "1.25rem",
    letterSpacing: "-0.6%",
  },
  tablist: {
    gap: 0,
    mb: "0.5rem",
  },
}))

const variants = {
  group: groupVariant,
}

export const Tabs = defineMultiStyleConfig({ variants })
