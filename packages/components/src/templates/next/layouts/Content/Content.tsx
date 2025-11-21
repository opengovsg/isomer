import type { ContentPageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { ContentLayoutSkeleton } from "../ContentSkeleton"

export const ContentLayout = (props: ContentPageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props
  return (
    <ContentLayoutSkeleton
      {...props}
      renderPageContent={renderPageContent({
        content,
        layout,
        site,
        LinkComponent,
        permalink: page.permalink,
      })}
    />
  )
}
