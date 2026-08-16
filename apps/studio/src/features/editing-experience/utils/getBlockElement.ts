// Blocks aren't individually wrapped (that broke the `first:mt-*`-style
// spacing most block components use), so instead we index directly into
// the children of the shared content container.
export const getBlockElement = (
  iframeDocument: Document | null,
  index: number | null,
): HTMLElement | undefined => {
  if (index === null || !iframeDocument) {
    return undefined
  }

  const contentBlocksContainer = iframeDocument.querySelector(
    "[data-isomer-content-blocks]",
  )

  return contentBlocksContainer?.children[index] as HTMLElement | undefined
}
