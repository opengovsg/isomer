import type { ContentPageSchemaType } from "~/types"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"
import { renderPageContent } from "../../render/renderPageContent"
import { ContentLayoutSkeleton } from "../ContentSkeleton"

export const ContentLayout = (props: ContentPageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props

  // note: this should be refactored so that we don't have to duplicate it for tooling/template
  const transformedContent = getTransformedPageContent(content)

  return (
    <ContentLayoutSkeleton
      {...props}
      renderPageContent={renderPageContent({
        content: transformedContent,
        layout,
        site,
        LinkComponent,
        permalink: page.permalink,
      })}
    />
  )
}
