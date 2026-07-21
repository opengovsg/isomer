import type { ContentPageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { ContentLayoutSkeleton } from "../ContentSkeleton"

export const ContentLayout = (props: ContentPageSchemaType) => {
  return (
    <ContentLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
