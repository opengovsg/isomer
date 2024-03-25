import type { HomePageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const HomepageLayout = ({
  site,
  props,
  meta,
  content,
  LinkComponent,
}: HomePageSchema) => {
  return (
    <Skeleton site={site} meta={meta}>
      {content.map((component) =>
        renderComponent({ component, LinkComponent }),
      )}
    </Skeleton>
  )
}

export default HomepageLayout
