export interface TableBubbleMenuAnchor {
  shouldWaitForReference: () => boolean
  getReferencedVirtualElement: () => {
    getBoundingClientRect: () => DOMRect
  } | null
}
