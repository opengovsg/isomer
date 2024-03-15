import type { IsomerPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: IsomerPageSchema) => {
  if (content.length < 2) {
    // Content layout requires at least 2 components
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

export default ContentLayout
