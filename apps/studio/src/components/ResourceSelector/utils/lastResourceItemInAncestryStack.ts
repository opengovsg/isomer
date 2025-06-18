import type { ResourceItemContent } from "~/schemas/resource"

export const lastResourceItemInAncestryStack = (
  resourceItemWithAncestryStack: ResourceItemContent[],
): ResourceItemContent | undefined => {
  return resourceItemWithAncestryStack[resourceItemWithAncestryStack.length - 1]
}
