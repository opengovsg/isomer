export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface ContainerOffset {
  containerRect: Pick<DOMRect, "top" | "left">
  scrollTop: number
  scrollLeft: number
}

export const viewportRectToContainerRect = ({
  rect,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & { rect: Rect }): Rect => ({
  top: rect.top - containerRect.top + scrollTop,
  left: rect.left - containerRect.left + scrollLeft,
  width: rect.width,
  height: rect.height,
})

export const containerRectToViewportRect = ({
  rect,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & { rect: Rect }): Rect => ({
  top: rect.top + containerRect.top - scrollTop,
  left: rect.left + containerRect.left - scrollLeft,
  width: rect.width,
  height: rect.height,
})

export const viewportPointToContainerPoint = ({
  clientX,
  clientY,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & {
  clientX: number
  clientY: number
}): { x: number; y: number } => ({
  x: clientX - containerRect.left + scrollLeft,
  y: clientY - containerRect.top + scrollTop,
})
