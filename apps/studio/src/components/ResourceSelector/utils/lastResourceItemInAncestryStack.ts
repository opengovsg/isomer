import type { ResourceItemContent } from "~/schemas/resource"

export const lastResourceItemInAncestryStack = (
  resourceItemWithAncestryStack: ResourceItemContent[],
): ResourceItemContent | undefined => 
  resourceItemWithAncestryStack[resourceItemWithAncestryStack.length - 1]

