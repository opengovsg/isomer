// Build-time replacement for `@opengovsg/isomer-components`'s
// `templates/next/components/complex/Hero/HeroLargeImage`, swapped in by
// next.config.mjs when no schema JSON uses variant "largeImage".
// Keeps ImageContainer out of the client bundle.
export function HeroLargeImage() {
  return null
}
