import { HomePageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"
import { ComponentContent } from "../../components/shared/CustomCssClass"

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: HomePageSchema) => {
  return (
    <Skeleton site={site} page={page}>
      <div
        className={`[&_.${ComponentContent}]:max-w-[1240px] [&_.${ComponentContent}]:px-6 [&_.${ComponentContent}]:md:px-10 [&_.${ComponentContent}]:mx-auto`}
      >
        {content.map((component) =>
          renderComponent({ component, LinkComponent }),
        )}
      </div>
    </Skeleton>
  )
}

export default HomepageLayout
