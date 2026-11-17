// Inlined into <head> by Page.astro. Replaces the click/error handlers of the "use client"
// components that vite-plugin.mjs renders without hydration (NO_HYDRATION). Kept tiny and
// framework-free; it runs before any image starts loading.

// ImageClient: swap broken images for the placeholder. `error` doesn't bubble, so capture it.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target
    if (img.tagName !== "IMG" || img.dataset.isomerFallback) return
    img.dataset.isomerFallback = "1"
    img.src = `${document.documentElement.dataset.assetsBaseUrl ?? ""}/placeholder_no_image.png`
  },
  true,
)

// BackToTopLink
document.addEventListener("click", (event) => {
  if (event.target.closest?.("[data-isomer-back-to-top]"))
    window.scrollTo({ top: 0 })
})
