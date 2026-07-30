import type { RenderPageContentParams } from "./types"
import { renderComponent } from "./renderComponent"
import { renderPageContentSkeleton } from "./renderPageContentSkeleton"

export const renderPageContent = (params: RenderPageContentParams) => {
  return renderPageContentSkeleton({ ...params, renderComponent })
}
