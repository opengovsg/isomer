// Pressing an unselected canvas block in the live preview selects it, and —
// like Wix — the same press should keep going as a placement drag. Selection
// remounts the placement control, so the in-flight press is handed over here:
// the click-to-edit hook records it on mousedown, and the newly mounted
// placement control picks it up as a grab. A press that is released before
// the control mounts is invalidated, so it can never turn into a drag whose
// mouse button is no longer down.
export interface CanvasPreviewGrabHandoff {
  blockIndex: number
  clientX: number
  clientY: number
}

let handoff: CanvasPreviewGrabHandoff | null = null

export const setCanvasPreviewGrabHandoff = (
  value: CanvasPreviewGrabHandoff,
  pressWindow: Window,
): void => {
  handoff = value
  const invalidate = () => {
    if (handoff === value) {
      handoff = null
    }
  }
  // The press happens inside the preview iframe, but the release can land on
  // either window; capture phase so no other handler can swallow it first
  pressWindow.addEventListener("mouseup", invalidate, {
    capture: true,
    once: true,
  })
  if (pressWindow !== window) {
    window.addEventListener("mouseup", invalidate, {
      capture: true,
      once: true,
    })
  }
}

export const takeCanvasPreviewGrabHandoff = (
  blockIndex: number,
): CanvasPreviewGrabHandoff | null => {
  if (handoff?.blockIndex !== blockIndex) {
    return null
  }
  const taken = handoff
  handoff = null
  return taken
}
