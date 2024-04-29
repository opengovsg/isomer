import { HomePageSchema } from "~/engine"
import ContentHole from "../../tiptap/ContentHole"
import { Skeleton } from "../Skeleton"

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
  NodeViewContent,
}: HomePageSchema) => {
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
        className={`[&_.component-content]:max-w-[1240px] [&_.component-content]:px-6 [&_.component-content]:md:px-10 [&_.component-content]:mx-auto`}
      >
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </div>
    </Skeleton>
  )
}

export default HomepageLayout
