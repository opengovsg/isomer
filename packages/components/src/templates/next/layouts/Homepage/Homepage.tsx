import { type HomePageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

export const HomepageLayout = ({
  site,
  page,
  layout,
  content,
}: HomePageSchemaType) => {
  return (
    <Skeleton site={site} page={page} layout={layout}>
      <div
        // ComponentContent = "component-content" (customCssClass.ts) is imported by all Homepage components,
        // but cannot be used here as tailwind does not support dynamic class names
        className={`wrap-break-word [&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10`}
      >
        {renderPageContent({
          content,
          layout,
          site,
          permalink: page.permalink,
        })}
      </div>
    </Skeleton>
  )
}
