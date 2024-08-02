import { validators } from "tailwind-merge"
import { createTV } from "tailwind-variants"

export const tv = createTV({
  twMergeConfig: {
    classGroups: {
      // Match everything in the prose namespace
      prose: [{ prose: [validators.isAny] }],
    },
  },
})
