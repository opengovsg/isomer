import type {
  Breakpoint,
  ImageAdjustment,
  ImageTier,
} from "@opengovsg/isomer-components"

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

// base is always "customised" (it's the stored crop); a breakpoint tier is
// customised only once it has its own entry.
export const isTierCustomised = (
  draft: ImageAdjustment | undefined,
  tier: ActiveTier,
): boolean => {
  if (tier === "base") return draft !== undefined
  return draft?.tiers?.some((t) => t.breakpoint === tier) ?? false
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

// Reset a tier back to inherited by dropping its entry (clears `tiers` entirely
// when it was the last one, so an un-customised image matches its original).
export const uncustomiseTier = (
  draft: ImageAdjustment,
  tier: Breakpoint,
): ImageAdjustment => {
  const nextTiers = (draft.tiers ?? []).filter((t) => t.breakpoint !== tier)
  return nextTiers.length > 0
    ? { ...draft, tiers: nextTiers }
    : { ...draft, tiers: undefined }
}

// Apply a crop+focal transform (rotate/flip) to base AND every tier, so a shared
// transform keeps all crops framing the same subject.
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
      return { ...t, crop: cf.crop, focal: cf.focal }
    }),
  }
}
