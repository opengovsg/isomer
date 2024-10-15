import merge from "lodash/merge"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import Preview from "./Preview"
import { ViewportContainer } from "./ViewportContainer"

export const EditPagePreview = (): JSX.Element => {
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()

  return (
    <ViewportContainer siteId={siteId}>
      <Preview
        {...merge(previewPageState, { page: { title } })}
        siteId={siteId}
        resourceId={pageId}
        permalink={permalink}
        lastModified={updatedAt.toISOString()}
        version="0.1.0"
      />
    </ViewportContainer>
  )
}
