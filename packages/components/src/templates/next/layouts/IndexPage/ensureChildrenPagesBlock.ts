import type { IndexPageSchemaType } from "~/types"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "~/interfaces/complex/ChildrenPages/constants"

export const ensureChildrenPagesBlock = (
  content: IndexPageSchemaType["content"],
): IndexPageSchemaType["content"] => {
  const hasChildrenPagesBlock = content.some(
    ({ type }) => type === "childrenpages",
  )

  return hasChildrenPagesBlock
    ? content
    : [...content, DEFAULT_CHILDREN_PAGES_BLOCK]
}
