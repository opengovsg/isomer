import merge from "lodash/merge"

import { textStyles as generatedTextStyles } from "../generated/textStyles"

const customTextStyles = {
  "h3-semibold": {
    fontWeight: 600,
    lineHeight: "2.25rem",
    fontSize: "1.75rem",
    letterSpacing: "-0.019em",
    fontFamily: "body",
  },
}

export const textStyles = merge(customTextStyles, generatedTextStyles)
