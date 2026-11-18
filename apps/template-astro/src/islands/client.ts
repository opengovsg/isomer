// Browser half of this site's islands runtime: hydrates every <isomer-island> rendered by ./server.
// Only the modules of islands present on the page are downloaded (islandLoaders), and React (or
// preact/compat, see astro.config.ts) is only downloaded if the page has an island.
import type { ComponentType } from "react"
import {
  InsideIsland,
  ISLAND_ATTRS,
  ISLAND_STYLE,
  ISLAND_TAG,
  islandLoaders,
  SLOT_KEY,
  SLOT_TAG,
} from "@opengovsg/isomer-components/islands"

const whenVisible = (island: HTMLElement, callback: () => void) => {
  // <isomer-island> is display: contents and has no box, so watch its first element instead.
  const target = island.firstElementChild ?? island
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        callback()
      }
    },
    { rootMargin: "200px" },
  )
  observer.observe(target)
}

const whenIdle = (callback: () => void) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(callback)
    : setTimeout(callback, 200)

const importReact = () =>
  Promise.all([import("react"), import("react-dom/client")])

export const hydrateIslands = () => {
  const islands = document.querySelectorAll<HTMLElement>(ISLAND_TAG)
  if (islands.length === 0) return
  // Shared by every island; started now so it downloads alongside the island modules.
  const react = importReact()

  for (const island of islands) {
    const name = island.getAttribute(ISLAND_ATTRS.component) ?? ""
    const when = island.getAttribute(ISLAND_ATTRS.hydrate)
    const islandId = island.getAttribute(ISLAND_ATTRS.islandId) ?? undefined
    const props = island.getAttribute(ISLAND_ATTRS.props) ?? "{}"
    // Read the slot's HTML now, before any island's hydration can change the DOM.
    const slotHtml = island.querySelector(
      `${SLOT_TAG}[${ISLAND_ATTRS.slot}="${CSS.escape(islandId ?? "")}"]`,
    )?.innerHTML

    const hydrate = async () => {
      const load = islandLoaders[name]
      if (!load) throw new Error(`[isomer-islands] unknown island ${name}`)
      const [[{ createElement }, { hydrateRoot }], Component] =
        await Promise.all([react, load()])
      const parsed = JSON.parse(props) as Record<string, unknown>
      const slot = parsed.children as Record<string, unknown> | undefined
      if (slot && typeof slot === "object" && SLOT_KEY in slot)
        parsed.children = createElement(SLOT_TAG, {
          [ISLAND_ATTRS.slot]: slot[SLOT_KEY],
          style: ISLAND_STYLE,
          suppressHydrationWarning: true,
          dangerouslySetInnerHTML: { __html: slotHtml ?? "" },
        })
      // Inside InsideIsland, the island() wrapper renders its component plainly.
      const element = createElement(
        InsideIsland.Provider,
        { value: true },
        createElement(
          Component as ComponentType<Record<string, unknown>>,
          parsed,
        ),
      )
      hydrateRoot(island, element, { identifierPrefix: islandId })
    }

    if (when === "visible") whenVisible(island, () => void hydrate())
    else if (when === "idle") whenIdle(() => void hydrate())
    else void hydrate()
  }
}
