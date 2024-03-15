import type { IsomerPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const HomepageLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: IsomerPageSchema) => {
  if (content.length < 3) {
    // Homepage layout requires at least 3 components
    return null
  }

  return (
    <Skeleton site={site} page={page}>
      {content.map((component) =>
        renderComponent({ component, LinkComponent }),
      )}
    </Skeleton>
  )
}

export default HomepageLayout
