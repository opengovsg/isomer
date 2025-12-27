import type {
  RenderPageContentOutput,
  RenderPageContentParams,
} from "../../render/types"
import type { HomePageSchemaType } from "~/types/schema"
import { Skeleton } from "../Skeleton"

interface HomepageLayoutSkeletonProps extends HomePageSchemaType {
  renderPageContent: (
    params: RenderPageContentParams,
  ) => RenderPageContentOutput
}

export const HomepageLayoutSkeleton = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
  renderPageContent,
}: HomepageLayoutSkeletonProps) => {
  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      <div
        // ComponentContent = "component-content" (customCssClass.ts) is imported by all Homepage components,
        // but cannot be used here as tailwind does not support dynamic class names
        className={`break-words [&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10`}
      >
        {renderPageContent({
          content,
          layout,
          site,
          LinkComponent,
          permalink: page.permalink,
        })}
      </div>
    </Skeleton>
  )
}
