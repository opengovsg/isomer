import type { ImageAdjustment, ImageTier } from "~/interfaces/complex/Image"
import { BREAKPOINTS, mediaMinWidth } from "~/constants/breakpoints"

import { focalToObjectPosition } from "./getFocalObjectPosition"
import { resolveManagedAssetUrl } from "./resolveManagedAssetUrl"

export interface ImagePictureSource {
  media: string
  srcSet: string
}

export interface ImageTierRendering {
  // <source> list, largest min-width first — <picture> takes the first match.
  sources: ImagePictureSource[]
  // Unique, SSR-deterministic class applied to the <img> and targeted by focalCss.
  focalClassName: string
  // Scoped stylesheet (for a <style> next to the <picture>): the base
  // object-position + one @media rule per tier, ascending so the largest matching
  // breakpoint wins by source order. object-position can't be varied per
  // breakpoint by an inline style, hence the scoped rules; px come from the shared
  // BREAKPOINTS so they stay in lockstep with the <source> media queries.
  focalCss: string
}

// Deterministic djb2 hash for a per-image class. No Math.random (SSR output must
// match hydration) — derived from the resolved base URL, already unique per bake.
const hash = (value: string): string => {
  let h = 5381
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h) ^ value.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

const byWidthAsc = (a: ImageTier, b: ImageTier) =>
  BREAKPOINTS[a.breakpoint] - BREAKPOINTS[b.breakpoint]

// Builds the <picture> sources + scoped focal CSS for a multi-tier image, or null
// when the image has no per-breakpoint tiers — the caller then renders the plain
// <img> + inline object-position (today's single-crop behaviour).
export const buildImageTierRendering = (
  src: string,
  imageAdjustment: ImageAdjustment | undefined,
  assetsBaseUrl: string | undefined,
): ImageTierRendering | null => {
  const tiers = imageAdjustment?.tiers
  if (tiers === undefined || tiers.length === 0) return null

  // <picture> evaluates <source>s top-down, so order largest-first.
  const sources = [...tiers]
    .sort((a, b) => byWidthAsc(b, a))
    .map((tier) => ({
      media: mediaMinWidth(tier.breakpoint),
      srcSet: resolveManagedAssetUrl(tier.src, assetsBaseUrl),
    }))

  const focalClassName = `isomer-focal-${hash(
    resolveManagedAssetUrl(src, assetsBaseUrl),
  )}`

  const rules: string[] = []
  if (imageAdjustment?.focal != null) {
    rules.push(
      `.${focalClassName}{object-position:${focalToObjectPosition(imageAdjustment.focal)}}`,
    )
  }
  // Ascending so a larger active breakpoint overrides a smaller one by source order.
  for (const tier of [...tiers].sort(byWidthAsc)) {
    rules.push(
      `@media ${mediaMinWidth(tier.breakpoint)}{.${focalClassName}{object-position:${focalToObjectPosition(tier.focal)}}}`,
    )
  }

  return { sources, focalClassName, focalCss: rules.join("") }
}
