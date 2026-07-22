---
title: Gate risky changes behind a GrowthBook flag; canary via enabledSites
category: Feature flags
type: best-practice
---

## Pattern

Ship risky or rollout-sensitive changes behind a GrowthBook flag **by default**,
so approval no longer requires certainty — if it's wrong, you flip the flag
instead of redeploying. Declare the flag key as a constant in
`apps/studio/src/lib/growthbook.ts`, read it via `useFeatureValue<T>(KEY,
fallback)` (client) or `gb.getFeatureValue(KEY, fallback)` (server), and always
give a **safe fallback** (the old/off behavior) so a GrowthBook outage degrades
gracefully.

To **canary to specific agencies**, use a `{ enabledSites: string[] }` flag value
and gate on `enabledSites.includes(siteId.toString())`, widening the list over
time. Studio is one multi-tenant app, so there is no infrastructure-level
(traffic-percentage) canary; that would hit random agencies, not chosen ones.

To **canary to specific individuals** such as internal testers instead of a whole agency, set GrowthBook's `email` targeting
condition in the dashboard. No hand-rolled check needed. `email` is already
a GrowthBook attribute on every request. Client-side,
`gb.setAttributes({ email })` runs in
`apps/studio/src/components/AvatarMenu.tsx`. Server-side, it is set in
`apps/studio/src/server/modules/auth/email/email.router.ts` and cleared on
logout.

## Why

- **Rollback = flag flip, not redeploy.** The scary part of approving a PR is
  "what if it breaks in prod" — a flag makes recovery instant and blast-radius
  small, which is the whole point of shipping without certainty.
- **Canary limits exposure to chosen agencies.** `enabledSites` lets one pilot
  agency exercise the change before it reaches everyone.
- **`email` targeting needs no app code.** Because the SDK already carries the
  `email` attribute, gating individual testers is a dashboard-only change —
  one less place for the check to drift or be implemented wrong.
- **Boundary — two classes this does _not_ fully cover.**
  1. **Can't be canaried, but can be kill-switched.** Global/shared behavior,
     cross-cutting refactors, and shared-component changes reach every agency at
     once, so `enabledSites` doesn't apply — but a _global boolean_ flag still
     buys an instant on/off recovery. Prefer that over no flag.
  2. **Can't be partially rolled out at all.** Some changes are all-or-nothing by
     nature — auth/login (e.g. **2FA**), session/security flows, and irreversible
     data migrations. You cannot run some users on the new login and some on the
     old, and flipping a flag off mid-flight can leave users _locked out or
     half-migrated_ — so a flag is not a clean undo here, and sometimes not
     appropriate at all. These are inherently high-stakes: ship them as a
     **deliberate, isolated release** (never batched), lean on strong pre-merge
     acceptance tests, and plan to **fix forward** — the 5xx auto-rollback is a
     backstop for crashes, not a safe undo for a half-applied auth change.

## Bad

```tsx
// Risky new feature shipped with no flag — reaches all agencies at once,
// and the only way back is a redeploy.
export function CategoryDropdown({ siteId }: Props) {
  return <NewDropdown siteId={siteId} />
}

// Or: flag read with a hard-coded key and an unsafe default that turns the
// new (risky) behavior ON when GrowthBook is unreachable.
const enabled = useFeatureValue<boolean>("category-dropdown", true)
```

## Good

```tsx
// Key declared once as a constant (apps/studio/src/lib/growthbook.ts).
import { CATEGORY_DROPDOWN_FEATURE_KEY } from "~/lib/growthbook"

// Canary by agency: default to no sites, widen enabledSites over time.
const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
  CATEGORY_DROPDOWN_FEATURE_KEY,
  { enabledSites: [] }, // safe fallback: off everywhere
)
const isDropdownEnabled = enabledSites.includes(siteId.toString())

// Simple on/off risky change: default OFF (old behavior) as the safe fallback.
const isNewThingEnabled = useFeatureValue<boolean>(SOME_FEATURE_KEY, false)
```

## How to detect

- A new risky/rollout-sensitive feature merged with **no** GrowthBook flag.
- `useFeatureValue` / `getFeatureValue` called with a **hard-coded string** key
  instead of a `*_FEATURE_KEY` constant from `lib/growthbook.ts`.
- A rollout-sensitive flag defaulting to `true` (unsafe fallback) — new behavior
  should default off, so an outage falls back to the known-good path. See the
  deliberate exception `IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE` in
  `apps/studio/src/lib/growthbook.ts` where `true` is intentional.
- Canary pattern reference: `enabledSites.includes(siteId.toString())` in
  `apps/studio/src/features/editing-experience/components/form-builder/renderers/controls/JsonFormsCategoryControl.tsx:66`.
- A hand-rolled `enabledEmails`/allowlist check in application code — `email`
  is already a live GrowthBook attribute (`apps/studio/src/components/AvatarMenu.tsx`,
  `apps/studio/src/server/modules/auth/email/email.router.ts`), so this belongs
  in a GrowthBook targeting condition instead.
