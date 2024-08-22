import { type HomePageSchemaType } from "~/engine"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
}: HomePageSchemaType) => {
  return (
    <Skeleton
      site={site}
      page={page}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      <div
        // ComponentContent = "component-content" (customCssClass.ts) is imported by all Homepage components,
        // but cannot be used here as tailwind does not support dynamic class names
        className={`[&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10`}
      >
        {renderPageContent({
          content,
          assetsBaseUrl: site.assetsBaseUrl,
          LinkComponent,
        })}
      </div>
    </Skeleton>
  )
}

export default HomepageLayout
