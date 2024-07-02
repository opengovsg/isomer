import { HomePageSchema } from "~/engine";
import { renderComponent, renderPageContent } from "../../render";
import { Skeleton } from "../Skeleton";

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
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
        className={`[&_.component-content]:mx-auto [&_.component-content]:max-w-container [&_.component-content]:px-6 [&_.component-content]:md:px-10`}
      >
        {renderPageContent({ content, LinkComponent })}
      </div>
    </Skeleton>
  );
};

export default HomepageLayout;
