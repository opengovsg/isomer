// @ts-check
// Inlined into <head> by Page.astro: the behaviour of components that render as static HTML
// (no island), keyed off data attributes they emit. Runs before the body is parsed.
//
// Plain JS on purpose: it is inlined verbatim (`?raw`), so it can't contain TypeScript syntax.

const root = document.documentElement

// Notification: same sessionStorage flag as before; hidden via CSS (see globals.css).
const NOTIFICATION_DISMISSED = "notification-dismissed"
try {
  if (sessionStorage.getItem(NOTIFICATION_DISMISSED) === "true")
    root.dataset.notificationDismissed = ""
} catch {
  // sessionStorage unavailable (privacy mode): the banner just stays visible.
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return

  // BackToTopLink
  if (event.target.closest("[data-isomer-back-to-top]"))
    window.scrollTo({ top: 0 })

  // Notification dismiss button
  if (event.target.closest("[data-isomer-notification-dismiss]")) {
    root.dataset.notificationDismissed = ""
    try {
      sessionStorage.setItem(NOTIFICATION_DISMISSED, "true")
    } catch {
      // Dismissed for this page view only.
    }
  }
})

// ImageClient: swap broken images for the placeholder. `error` doesn't bubble, so capture it.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target
    if (!(img instanceof HTMLImageElement) || img.dataset.isomerFallback) return
    img.dataset.isomerFallback = "1"
    img.src = `${root.dataset.assetsBaseUrl ?? ""}/placeholder_no_image.png`
  },
  true,
)
