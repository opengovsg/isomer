import { NotFoundPageSchema } from "~/engine";
import { renderComponent } from "../../render";
import { Skeleton } from "../Skeleton";

const NotFoundLayout = ({
  site,
  page,
  LinkComponent = "a",
  ScriptComponent = "script",
}: NotFoundPageSchema) => {
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
        {renderComponent({
          component: {
            type: "infobar",
            title: "Oh no, we couldn't find that page",
            description: "404: Page not found",
            buttonLabel: "Go to homepage",
            buttonUrl: "/",
          },
          LinkComponent,
        })}
      </div>
    </Skeleton>
  );
};

export default NotFoundLayout;
