// Browser half of this site's islands runtime: hydrates every <isomer-island> rendered by ./server.
// Only the modules of islands on the page are downloaded, and React (preact/compat in production)
// is only downloaded if the page has an island at all.
import type { IslandName } from "@opengovsg/isomer-components/islands"
import type { ComponentType } from "react"
import {
  IslandContent,
  islands,
  ISLAND_TAG,
  readIslandAttributes,
  isSlotMarker,
  SLOT_TAG,
  slotAttributes,
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
  const elements = document.querySelectorAll<HTMLElement>(ISLAND_TAG)
  if (elements.length === 0) return
  // Shared by every island; started now so it downloads alongside the island modules.
  const react = importReact()

  for (const element of elements) {
    const { name, hydrate: when, id, props } = readIslandAttributes(element)
    const load = islands[name as IslandName]
    // Read the slot's HTML now, before any island's hydration can change the DOM.
    const slotHtml = element.querySelector(SLOT_TAG)?.innerHTML

    const hydrate = async () => {
      const [[{ createElement }, { hydrateRoot }], module] = await Promise.all([
        react,
        load(),
      ])
      const Component = (module as Record<string, ComponentType>)[name]
      if (!Component) throw new Error(`[isomer-islands] ${name} isn't exported`)
      const parsed = JSON.parse(props) as Record<string, unknown>
      if (isSlotMarker(parsed.children))
        parsed.children = createElement(SLOT_TAG, {
          ...slotAttributes,
          suppressHydrationWarning: true,
          dangerouslySetInnerHTML: { __html: slotHtml ?? "" },
        })
      hydrateRoot(
        element,
        createElement(IslandContent, { Component, props: parsed }),
        { identifierPrefix: id },
      )
    }

    if (when === "visible") whenVisible(element, () => void hydrate())
    else if (when === "idle") whenIdle(() => void hydrate())
    else void hydrate()
  }
}
