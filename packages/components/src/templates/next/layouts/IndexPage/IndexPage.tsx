import type { IndexPageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { IndexPageLayoutSkeleton } from "../IndexPageSkeleton"

export { ensureChildrenPagesBlock } from "./ensureChildrenPagesBlock"

export const IndexPageLayout = (props: IndexPageSchemaType) => {
  return (
    <IndexPageLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
