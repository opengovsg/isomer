import type { ContentPageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { ContentLayoutSkeleton } from "../ContentSkeleton"

export const ContentLayout = (props: ContentPageSchemaType) => {
  return (
    <ContentLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
