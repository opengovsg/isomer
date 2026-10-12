# Asset-management RFC: interaction notes for image adjustment

**Status:** notes to confirm with the RFC authors (no substantive change requested)
**Raised by:** the image-adjustment work ([ADR 0010](./0010-image-adjustment-bake-for-render-preserve-original.md))
**Target RFC:** ["Refactoring our asset management"](https://app.notion.com/p/opengov/Refactoring-our-asset-management-3b577dbba788806d9328db817b5030f8)

## Summary

The "Adjust image" feature stores, in a single asset folder, an **immutable original upload** and a **baked render copy** (the original with crop/rotate/flip applied). The page renders the baked copy; the editor always re-bakes from the original, so the original is the source of truth.

This rides mechanics the RFC already provides, and **needs no substantive change**:
- **References resolve by folder** (the RFC matches via the directory portion of `Asset.s3Key`), so the baked `src` keeps the folder's one `Asset` referenced — the original is sweep-protected for free.
- **Removal acts on the whole folder**, so original + baked are one indivisible lifecycle unit with one `AssetLink`.
- **Visibility is derived per-Asset** by OR-ing all its `AssetLink` published flags (*"Any `usedInPublished = true` → enable public access"*), so the original and baked simply share the folder's visibility.

There is **one wording clarification** to confirm, and **one deliberate acceptance** to put on the record.

## Wording clarification to confirm

The RFC's *"renditions live in the same folder, are not registered separately, and removal acts on the whole folder"* currently reads as infra-generated `.webp`/`.avif` only. Please extend the wording to acknowledge a **Studio-generated baked render** as another same-folder object of the one `Asset`.

This is the first time *Studio* (not just the infra compression Lambda) writes a sibling object into an existing asset folder. No mechanism changes — folder-resolution and folder-removal already cover it — but the RFC's mental model of "one uploaded original + infra variants" should be updated to "one uploaded original + a Studio-baked render + variants of each," so a future reader does not assume a folder holds exactly one logical asset.

## Deliberate acceptance to put on the record

**The original upload becomes publicly reachable once any page publishes the image.** Because visibility is folder-level, publishing the baked copy also un-privatizes the original in the same folder.

We accept this. The exposure is narrow: the original is never referenced on the published site (only the baked copy is in `src`), so it is fetchable only via its exact, unguessable-UUID path. The one scenario where it would matter — an author using *crop as redaction* to hide sensitive content — is a misuse the feature deliberately does not support (redaction must never be "crop and hope").

Flagging it here so it is a conscious, shared decision rather than a silent side effect of the folder-level visibility model.

## Considered and rejected: per-object visibility

We considered asking the RFC to support **per-object visibility within a folder** — keep the original tagged `private` permanently while the baked is public — so the original would never be exposed.

Rejected for now because it works against the grain of the RFC (visibility is an Asset-level property derived from links, not an object-level one), and it would cost: per-object publish/un-privatize logic, an `isomer-next-infra` Access Point policy change, and a compression Lambda change to propagate `private` onto a source-original's variants — plus a cross-repo sequencing dependency. That is disproportionate given the exposure above is acceptable.

**This remains the escalation path** if a future feature needs a genuinely-private original (e.g. a real redaction workflow). Recorded here so the option and its cost are not re-derived from scratch later.
