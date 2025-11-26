import type { RenderPageContentOutput, RenderPageContentParams } from "./types"
import { renderComponent } from "./renderComponent"
import { renderPageContentSkeleton } from "./renderPageContentSkeleton"

export const renderPageContent = (
  props: RenderPageContentParams,
): RenderPageContentOutput => {
  return renderPageContentSkeleton({ ...props, renderComponent })
}
