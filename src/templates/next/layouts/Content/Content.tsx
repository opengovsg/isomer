import type { ContentPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const ContentLayout = ({
  site,
  meta,
  props,
  content,
  LinkComponent,
}: ContentPageSchema) => {
  return (
    <Skeleton site={site} meta={meta}>
      {content.map((component) =>
        renderComponent({ component, LinkComponent }),
      )}
    </Skeleton>
  )
}

export default ContentLayout
