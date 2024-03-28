import { HomePageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: HomePageSchema) => {
  return (
    <Skeleton site={site} page={page}>
      <div
        className={`[&_.component-content]:max-w-[1240px] [&_.component-content]:px-6 [&_.component-content]:md:px-10 [&_.component-content]:mx-auto`}
      >
        {content.map((component) =>
          renderComponent({ component, LinkComponent }),
        )}
      </div>
    </Skeleton>
  )
}

export default HomepageLayout
