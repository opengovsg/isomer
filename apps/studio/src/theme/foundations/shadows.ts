import merge from "lodash/merge"

import { shadows as generatedShadows } from "../generated/shadows"

const customShadows = {
  focus: `0 0 0 1px var(--chakra-colors-utility-focus-default)`,
}

export const shadows = merge(customShadows, generatedShadows)
