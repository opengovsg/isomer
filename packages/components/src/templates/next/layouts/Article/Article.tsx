import type { ArticlePageSchemaType } from "~/types"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"
import { renderPageContent } from "../../render/renderPageContent"
import { ArticleLayoutSkeleton } from "../ArticleSkeleton"

export const ArticleLayout = (props: ArticlePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props

  const transformedContent = getTransformedPageContent(content)

  return (
    <ArticleLayoutSkeleton
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
