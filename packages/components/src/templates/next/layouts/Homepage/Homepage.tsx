import type { HomePageSchemaType } from "~/types"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"
import { renderPageContent } from "../../render/renderPageContent"
import { HomepageLayoutSkeleton } from "../HomepageSkeleton"

export const HomepageLayout = (props: HomePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props

  const transformedContent = getTransformedPageContent(content)

  return (
    <HomepageLayoutSkeleton
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
