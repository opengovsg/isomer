import type { ArticlePageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { ArticleLayoutSkeleton } from "../ArticleSkeleton"

export const ArticleLayout = (props: ArticlePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props
  return (
    <ArticleLayoutSkeleton
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
