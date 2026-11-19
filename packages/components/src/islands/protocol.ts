// The markup an island renders as, and how a host reads it back. Both ends live here so the
// attribute names are written down once.
//
//   <isomer-island data-component="NavbarClient" data-hydrate="load"
//                  data-island-id=":R1:" data-props='{"items":[…]}'>
//     …server-rendered HTML…
//     <isomer-slot>…server-rendered children…</isomer-slot>
//   </isomer-island>
//
// Studio renders only data-component; the published-site build adds the rest for hydration.
import type { IslandName } from "./registry"

// When the published site hydrates an island:
//   "load"    as soon as the page's script runs
//   "visible" when scrolled near (below-the-fold or decorative content)
//   "idle"    when the browser is idle (never urgent, e.g. third-party widgets)
export type HydrateWhen = "load" | "visible" | "idle"

export const ISLAND_TAG = "isomer-island"
export const SLOT_TAG = "isomer-slot"

// Keeps the markers out of layout (same approach as Astro's <astro-island>).
const OUT_OF_LAYOUT = { display: "contents" } as const

interface IslandMarkup {
  name: IslandName
  hydrate?: HydrateWhen
  id?: string
  /** JSON-serialized props */
  props?: string
}

export const islandAttributes = ({
  name,
  hydrate,
  id,
  props,
}: IslandMarkup) => ({
  "data-component": name,
  "data-hydrate": hydrate,
  "data-island-id": id,
  "data-props": props,
  style: OUT_OF_LAYOUT,
})

export const readIslandAttributes = (island: Element) => ({
  name: island.getAttribute("data-component") ?? "",
  hydrate: (island.getAttribute("data-hydrate") ?? "load") as HydrateWhen,
  id: island.getAttribute("data-island-id") ?? "",
  props: island.getAttribute("data-props") ?? "{}",
})

// Server-rendered `children` are shipped as HTML in the island's slot (each island has at most one;
// a nested island's slot sits inside it, so the first one found is the island's own). In the
// serialized props, `children` holds a marker in its place.
export const slotAttributes = { style: OUT_OF_LAYOUT }

export const SLOT_MARKER = { $slot: true } as const

export const isSlotMarker = (value: unknown) =>
  typeof value === "object" && value !== null && "$slot" in value
