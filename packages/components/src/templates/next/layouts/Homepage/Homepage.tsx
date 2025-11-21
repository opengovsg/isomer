import type { HomePageSchemaType } from "~/types"
import { renderPageContent } from "../../render/renderPageContent"
import { HomepageLayoutSkeleton } from "../HomepageSkeleton"

export const HomepageLayout = (props: HomePageSchemaType) => {
  const { site, page, layout, content, LinkComponent } = props
  return (
    <HomepageLayoutSkeleton
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
