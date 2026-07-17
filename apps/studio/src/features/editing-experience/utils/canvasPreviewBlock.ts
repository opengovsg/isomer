import {
  CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE,
  CANVAS_CONTAINER_DATA_ATTRIBUTE,
} from "@opengovsg/isomer-components"

// The live preview renders the page inside a react-frame-component iframe;
// the editor drawer cannot reach it via refs, so locate it by looking for
// the iframe whose document contains a rendered canvas
export const findPreviewDocumentWithCanvas = (doc: Document): Document | null =>
  Array.from(doc.querySelectorAll("iframe"))
    .map((iframe) => iframe.contentDocument)
    .find(
      (innerDoc) =>
        innerDoc?.querySelector(`[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`) != null,
    ) ?? null

// Canvases render in content order, so the nth canvas block on the page is
// the nth canvas container in the preview document
export const findCanvasBlockPreviewElement = (
  doc: Document,
  canvasOrdinal: number,
  blockIndex: number,
): HTMLElement | null => {
  const previewDocument = findPreviewDocumentWithCanvas(doc)
  const canvas = previewDocument
    ?.querySelectorAll(`[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`)
    .item(canvasOrdinal)
  return (
    canvas?.querySelector<HTMLElement>(
      `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}="${blockIndex}"]`,
    ) ?? null
  )
}
