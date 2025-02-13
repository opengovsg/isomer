import { createMultiStyleConfigHelpers } from "@chakra-ui/styled-system"
import { anatomy } from "@chakra-ui/theme-tools"

import { textStyles } from "../generated/textStyles"

const parts = anatomy("searchbar").parts("icon", "field")
const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys)

export const Searchbar = defineMultiStyleConfig({
  variants: {
    outline: {
      field: {
        ...textStyles["body-2"],
      },
    },
  },
})
