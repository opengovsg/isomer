// @ts-check
// Inlined into <head> by Page.astro. Replaces the click/error handlers of the "use client"
// components that vite-plugin.ts renders without hydration (NO_HYDRATION). Kept tiny and
// framework-free; it runs before any image starts loading.
//
// Plain JS on purpose: it is inlined verbatim (`?raw`), so it can't contain TypeScript syntax.

// ImageClient: swap broken images for the placeholder. `error` doesn't bubble, so capture it.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target
    if (!(img instanceof HTMLImageElement) || img.dataset.isomerFallback) return
    img.dataset.isomerFallback = "1"
    img.src = `${document.documentElement.dataset.assetsBaseUrl ?? ""}/placeholder_no_image.png`
  },
  true,
)

// BackToTopLink
document.addEventListener("click", (event) => {
  if (
    event.target instanceof Element &&
    event.target.closest("[data-isomer-back-to-top]")
  )
    window.scrollTo({ top: 0 })
})
