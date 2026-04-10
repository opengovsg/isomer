import { merge } from "lodash-es"
import { colours as generatedColours } from "../generated/colours"

const customColours = {
  base: {
    canvas: {
      light: "#babecb",
    },
  },
}

export const colours = merge(customColours, generatedColours)
