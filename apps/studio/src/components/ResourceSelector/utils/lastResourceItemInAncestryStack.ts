import type { ResourceItemContent } from "~/schemas/resource"

export const lastResourceItemInAncestryStack = (
  resourceItemWithAncestryStack: ResourceItemContent[],
): ResourceItemContent | undefined => resourceItemWithAncestryStack.at(-1)
