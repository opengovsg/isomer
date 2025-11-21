import type { IndexPageSchemaType } from "~/types"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "~/interfaces/complex/ChildrenPages/constants"
import { renderPageContent } from "../../render/renderPageContent"
import { IndexPageLayoutSkeleton } from "../IndexPageSkeleton"

export const IndexPageLayout = (props: IndexPageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props

  // note: this should be refactored so that we don't have to duplicate it for tooling/template
  const hasChildpageBlock = content.some(({ type }) => type === "childrenpages")
  const pageContent: IndexPageSchemaType["content"] = hasChildpageBlock
    ? content
    : [...content, DEFAULT_CHILDREN_PAGES_BLOCK]

  return (
    <IndexPageLayoutSkeleton
      {...props}
      renderPageContent={renderPageContent({
        content: pageContent,
        layout,
        site,
        LinkComponent,
        permalink: page.permalink,
      })}
    />
  )
}
