import { useEffect } from "react"

const POPOVER_SELECTOR = ".chakra-popover__content"
const POPPER_SELECTOR = ".chakra-popover__popper"
const VIEWPORT_MARGIN_PX = 16
const MIN_HEIGHT_PX = 120

const clampToViewport = (el: HTMLElement) => {
  const { top } = el.getBoundingClientRect()
  const available = window.innerHeight - top - VIEWPORT_MARGIN_PX
  el.style.maxHeight = `${Math.max(available, MIN_HEIGHT_PX)}px`
}

// Popper.js positions the popover by writing `transform` directly onto its
// `.chakra-popover__popper` ancestor, asynchronously and not always within
// the same tick the popover mounts, so a bounded polling window isn't
// reliable. Watch that ancestor's `style` attribute instead and (re-)clamp
// only once Popper actually writes a real position to it.
const watchForPlacement = (contentEl: HTMLElement) => {
  const popperEl = contentEl.closest<HTMLElement>(POPPER_SELECTOR)
  if (!popperEl) return

  const recompute = () => {
    if (!contentEl.isConnected) {
      styleObserver.disconnect()
      return
    }
    clampToViewport(contentEl)
  }

  const styleObserver = new MutationObserver(recompute)
  styleObserver.observe(popperEl, {
    attributes: true,
    attributeFilter: ["style"],
  })

  // Popper may have already positioned it (e.g. re-render of an
  // already-open popover) before this observer attaches.
  recompute()
}

// Popper's flip/preventOverflow doesn't reliably keep the DatePicker's
// calendar popover on-screen; it can settle at a position that still
// overflows past the viewport bottom. Rather than patch Popper's config,
// wait for its positioning to land and cap the popover's height to the
// space actually available, so it only scrolls internally when it would
// otherwise run off-screen.
export const useClampDatePickerHeight = () => {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          const popover = node.matches(POPOVER_SELECTOR)
            ? node
            : node.querySelector<HTMLElement>(POPOVER_SELECTOR)
          if (popover) watchForPlacement(popover)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
}
