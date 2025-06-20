export const initializeSSRPolyfill = async () => {
  // This will be tree-shaken out of client bundles
  if (typeof window !== "undefined") {
    return
  }

  await import("interweave-ssr").then(({ polyfill }) => {
    polyfill()
  })
}
