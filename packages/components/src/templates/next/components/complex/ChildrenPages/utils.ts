import type { ChildPage } from "./types"
import type { ChildrenPagesProps } from "~/interfaces"

export const mergeChildrenPages = (
  a: ChildPage,
  b: ChildPage,
  childrenPagesOrdering: ChildrenPagesProps["childrenPagesOrdering"] = [],
) => {
  const [aIndex, bIndex] = [
    childrenPagesOrdering.indexOf(a.id),
    childrenPagesOrdering.indexOf(b.id),
  ]

  if (aIndex === bIndex) {
    return a.title.localeCompare(b.title, undefined, { numeric: true })
  }

  if (aIndex === -1) {
    return 1
  }

  if (bIndex === -1) {
    return -1
  }

  return aIndex - bIndex
}
