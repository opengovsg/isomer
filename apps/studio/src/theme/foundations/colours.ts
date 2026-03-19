import merge from "lodash/merge"

import { colours as generatedColours } from "../generated/colours"

const customColours = {
  base: {
    canvas: {
      light: "#babecb",
    },
  },
}

export const colours = merge(customColours, generatedColours)
