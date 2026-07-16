import type { CanvasProps } from "~/interfaces"
import { renderComponent } from "../../../render/renderComponent"

export const Canvas = ({
  blocks,
  width,
  height,
  layout,
  site,
  LinkComponent,
  shouldLazyLoad,
  permalink,
}: CanvasProps) => {
  return (
    <div
      className="resize overflow-auto rounded-lg border border-divider-medium p-5 [&:not(:first-child)]:mt-7"
      // Scrollable region must be keyboard-focusable (same as Table.tsx)
      tabIndex={0}
      style={{
        width: width !== undefined ? `${width}%` : undefined,
        height: height !== undefined ? `${height}px` : undefined,
      }}
    >
      {blocks.map((block, index) =>
        renderComponent({
          elementKey: index,
          component: block,
          layout,
          site,
          LinkComponent,
          shouldLazyLoad,
          permalink,
        }),
      )}
    </div>
  )
}
