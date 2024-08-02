import { extendTailwindMerge, validators } from "tailwind-merge"

type MergeConfig = Parameters<typeof extendTailwindMerge>[0]
type AdditionalClassGroupIds = "prose"

// Exported for used in tailwind-variants too.
export const customTwMergeConfig = {
  extend: {
    classGroups: {
      // Match everything in the prose namespace
      prose: [{ prose: [validators.isAny] }],
    },
  },
} satisfies MergeConfig

export const twMerge =
  extendTailwindMerge<AdditionalClassGroupIds>(customTwMergeConfig)
