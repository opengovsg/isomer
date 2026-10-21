import type {
  Breakpoint,
  ImageAdjustment,
  ImageTier,
} from "@opengovsg/isomer-components"
import { BREAKPOINTS } from "@opengovsg/isomer-components"

/**
 * Default adjustment with all required fields.
 * originalKey "" is intentional — the save hook resolves the real key from the current src.
 */
export const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x: 0.5, y: 0.5 },
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "",
}

/**
 * Ensures an adjustment exists by returning the draft or creating a default.
 */
export const ensureAdjustment = (draft?: ImageAdjustment): ImageAdjustment =>
  draft ?? DEFAULT_ADJUSTMENT

// ---------------------------------------------------------------------------
// Per-breakpoint tiers (per-breakpoint-crop RFC)
//
// The modal edits one tier at a time: "base" (the top-level crop/focal) or one
// of the component's breakpoints (an entry in `tiers`). A breakpoint tier is
// "customised" only once it has its own entry; until then it inherits base and
// stores/bakes nothing. These helpers keep that model in one place so the modal
// and the save/bake flow agree on it.
// ---------------------------------------------------------------------------

export type ActiveTier = "base" | Breakpoint

type CropFocal = Pick<ImageTier, "crop" | "focal">

// Config lists only the breakpoints above base; sort ascending defensively.
const sortBreakpointsAsc = (bps: Breakpoint[]): Breakpoint[] =>
  [...bps].sort((a, b) => BREAKPOINTS[a] - BREAKPOINTS[b])

// The ordered selectable tiers for a component: "base" first (implied, always
// present), then its configured breakpoints ascending.
export const tierOrder = (
  configTiers: Breakpoint[] | undefined,
): ActiveTier[] => ["base", ...sortBreakpointsAsc(configTiers ?? [])]

// Human label for the viewport range a tier governs, derived from where the next
// tier starts: base spans up to the first tier; a middle tier is a closed range;
// the last tier is open-ended "and up". Deliberately NOT device names — base can
// span mobile+tablet, so "Mobile" would misrepresent its coverage.
export const tierRangeLabel = (
  tier: ActiveTier,
  configTiers: Breakpoint[],
): string => {
  const sorted = sortBreakpointsAsc(configTiers)
  if (tier === "base") {
    const first = sorted[0]
    return first === undefined
      ? "Default"
      : `Default · up to ${BREAKPOINTS[first]}px`
  }
  const next = sorted[sorted.indexOf(tier) + 1]
  const lower = BREAKPOINTS[tier]
  return next === undefined
    ? `${lower}px and up`
    : `${lower}–${BREAKPOINTS[next] - 1}px`
}

// The tier that governs a given viewport width: the largest configured
// breakpoint whose min-width the viewport meets, else "base". Maps a preview
// pane (rendered at a viewport width) to the tier whose crop applies there.
export const governingTierForWidth = (
  width: number,
  configTiers: Breakpoint[],
): ActiveTier => {
  let governing: ActiveTier = "base"
  for (const bp of sortBreakpointsAsc(configTiers)) {
    if (width >= BREAKPOINTS[bp]) governing = bp
  }
  return governing
}

// A coarse device class for a viewport width, used to LABEL a tier by the kinds
// of screen it covers (rather than the exact px range). Thresholds are the
// shared md/lg breakpoints: phones below md, tablets md–lg, desktops lg and up.
export type DeviceBucket = "Mobile" | "Tablet" | "Desktop"
const DEVICE_BUCKET_ORDER: DeviceBucket[] = ["Mobile", "Tablet", "Desktop"]

export const deviceBucket = (width: number): DeviceBucket =>
  width >= BREAKPOINTS.lg
    ? "Desktop"
    : width >= BREAKPOINTS.md
      ? "Tablet"
      : "Mobile"

// Width assumed for a previewState that declares none — mirrors
// AdjustmentPreview's own `?? 1024` fallback so labels and panes agree on it.
const DEFAULT_PREVIEW_WIDTH = BREAKPOINTS.lg

// Device-type label for a tier: the unique device buckets of the previewStates
// it governs (governingTierForWidth), in Mobile→Tablet→Desktop order, joined
// with " and " (e.g. "Mobile and Tablet", "Desktop"). Falls back to the px-range
// label if the tier governs no previewState (defensive — a configured tier
// normally governs at least one).
export const tierDeviceLabel = (
  tier: ActiveTier,
  configTiers: Breakpoint[],
  previewStates: readonly { viewportWidth?: number }[],
): string => {
  const buckets = new Set<DeviceBucket>()
  for (const ps of previewStates) {
    const width = ps.viewportWidth ?? DEFAULT_PREVIEW_WIDTH
    if (governingTierForWidth(width, configTiers) === tier) {
      buckets.add(deviceBucket(width))
    }
  }
  const ordered = DEVICE_BUCKET_ORDER.filter((b) => buckets.has(b))
  return ordered.length > 0
    ? ordered.join(" and ")
    : tierRangeLabel(tier, configTiers)
}

// The crop/focal to show for a tier: its own if customised, base's for "base",
// or undefined for an inherited (uncustomised) breakpoint tier.
export const getTierCropFocal = (
  draft: ImageAdjustment | undefined,
  tier: ActiveTier,
): CropFocal | undefined => {
  if (draft === undefined) return undefined
  if (tier === "base") return { crop: draft.crop, focal: draft.focal }
  return draft.tiers?.find((t) => t.breakpoint === tier)
}

// Write crop and/or focal to a tier. "base" updates the top-level fields; a
// breakpoint tier updates its entry (creating one from base defensively if the
// caller skipped customiseTier). A crop change clears the tier's `src` so the
// save/bake flow re-bakes it; a focal-only change keeps `src` (focal is
// render-time CSS, not baked).
export const updateTierCropFocal = (
  draft: ImageAdjustment,
  tier: ActiveTier,
  patch: Partial<CropFocal>,
): ImageAdjustment => {
  if (tier === "base") return { ...draft, ...patch }
  const applyPatch = (t: ImageTier): ImageTier => {
    const next = { ...t, ...patch }
    return patch.crop !== undefined ? { ...next, src: "" } : next
  }
  const tiers = draft.tiers ?? []
  const exists = tiers.some((t) => t.breakpoint === tier)
  const nextTiers = exists
    ? tiers.map((t) => (t.breakpoint === tier ? applyPatch(t) : t))
    : [
        ...tiers,
        applyPatch({
          breakpoint: tier,
          crop: draft.crop,
          focal: draft.focal,
          src: "",
        }),
      ]
  return { ...draft, tiers: nextTiers }
}

// Opt-in: seed a tier from base's crop + focal (the user adjusts from there).
// Idempotent. src "" is a placeholder the save/bake flow fills.
export const customiseTier = (
  draft: ImageAdjustment,
  tier: Breakpoint,
): ImageAdjustment => {
  if (draft.tiers?.some((t) => t.breakpoint === tier)) return draft
  const seeded: ImageTier = {
    breakpoint: tier,
    crop: draft.crop,
    focal: draft.focal,
    src: "",
  }
  return { ...draft, tiers: [...(draft.tiers ?? []), seeded] }
}

// Apply a crop+focal transform (rotate/flip) to base AND every tier, so a shared
// transform keeps all crops framing the same subject. Because it changes every
// tier's crop, each tier's src is cleared (the re-bake sentinel) — stale baked
// pixels would otherwise survive a rotate/flip.
export const mapAllTiersCropFocal = (
  draft: ImageAdjustment,
  fn: (cf: CropFocal) => CropFocal,
): ImageAdjustment => {
  const baseCf = fn({ crop: draft.crop, focal: draft.focal })
  return {
    ...draft,
    crop: baseCf.crop,
    focal: baseCf.focal,
    tiers: draft.tiers?.map((t) => {
      const cf = fn({ crop: t.crop, focal: t.focal })
      return { ...t, crop: cf.crop, focal: cf.focal, src: "" }
    }),
  }
}
