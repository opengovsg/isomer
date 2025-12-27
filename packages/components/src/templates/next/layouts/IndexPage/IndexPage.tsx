import type { IndexPageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { IndexPageLayoutSkeleton } from "../IndexPageSkeleton"

export const IndexPageLayout = (props: IndexPageSchemaType) => {
  return (
    <IndexPageLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
