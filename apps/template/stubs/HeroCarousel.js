// Build-time replacement for `@opengovsg/isomer-components`'s
// `templates/next/components/complex/Hero/HeroCarousel`, swapped in by
// next.config.mjs when no schema JSON uses variant "carousel".
// Keeps the carousel client modules out of the client bundle.
export function HeroCarousel() {
  return null
}
