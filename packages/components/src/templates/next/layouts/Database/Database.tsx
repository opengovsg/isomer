import type { DatabasePageSchemaType } from "~/types"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"
import { renderPageContent } from "../../render/renderPageContent"
import { DatabaseLayoutSkeleton } from "../DatabaseSkeleton"

export const DatabaseLayout = (props: DatabasePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props

  const transformedContent = getTransformedPageContent(content)

  return (
    <DatabaseLayoutSkeleton
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
