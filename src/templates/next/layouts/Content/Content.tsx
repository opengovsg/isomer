import { ContentPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: ContentPageSchema) => {
  return (
    <Skeleton site={site} page={page}>
      {content.map((component) =>
        renderComponent({ component, LinkComponent }),
      )}
    </Skeleton>
  )
}

export default ContentLayout
