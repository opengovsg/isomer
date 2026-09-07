import { merge } from "lodash-es"

import { textStyles as generatedTextStyles } from "../generated/textStyles"

const customTextStyles = {
  "h3-semibold": {
    fontFamily: "body",
    fontSize: "1.75rem",
    fontWeight: 600,
    letterSpacing: "-0.019em",
    lineHeight: "2.25rem",
  },
}

export const textStyles = merge(customTextStyles, generatedTextStyles)
