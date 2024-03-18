import type { IsomerPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: IsomerPageSchema) => {
  return (
    <Skeleton site={site} page={page}>
      {content.map((component) =>
        renderComponent({ component, LinkComponent }),
      )}
    </Skeleton>
  )
}

export default ContentLayout
