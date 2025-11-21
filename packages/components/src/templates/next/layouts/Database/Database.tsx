import type { DatabasePageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { DatabaseLayoutSkeleton } from "../DatabaseSkeleton"

export const DatabaseLayout = (props: DatabasePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props
  return (
    <DatabaseLayoutSkeleton
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
