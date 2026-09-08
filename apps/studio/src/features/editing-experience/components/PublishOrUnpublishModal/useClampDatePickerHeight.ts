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
// `.chakra-popover__popper` ancestor — asynchronously, and (confirmed by
// direct measurement) not necessarily within the same second the popover
// mounts, so polling for a bounded window isn't reliable either. Instead of
// guessing timing, watch that ancestor's `style` attribute directly and
// (re-)clamp only when Popper actually writes a real position to it.
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
// calendar popover fully on-screen — it can settle at a position where the
// popover still overflows past the viewport bottom (confirmed by direct
// measurement). Rather than patch the vendor library's Popper config, this
// watches for Popper's own positioning to land and caps the popover's
// height to genuinely-available space at that point, so it scrolls
// internally exactly when (and only when) it would otherwise run
// off-screen.
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
