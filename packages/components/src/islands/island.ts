// Island boundaries: the components that hydrate in the browser on published sites.
//
// island() wraps a component so it always renders inside an <isomer-island> element in every host
// (Studio preview, Storybook, published site), keeping their DOM identical. A host that hydrates
// islands (apps/template-astro) injects a renderer through IslandRendererContext to add what it
// needs for hydration. Everywhere else the wrapper just renders the component inside the marker.
import type { ComponentType, JSXElementConstructor, ReactElement } from "react"
import { createContext, createElement, forwardRef, useContext } from "react"

// The markup protocol between island() and a host's hydration runtime. Hosts should use these
// rather than repeat the strings.
export const ISLAND_TAG = "isomer-island"
export const SLOT_TAG = "isomer-slot"
export const ISLAND_ATTRS = {
  component: "data-component",
  hydrate: "data-hydrate",
  islandId: "data-island-id",
  props: "data-props",
  slot: "data-slot",
} as const
/** A serialized prop `{ [SLOT_KEY]: slotId }` stands for server-rendered React nodes. */
export const SLOT_KEY = "$slot"
// display: contents keeps the markers out of layout (same approach as Astro's <astro-island>).
export const ISLAND_STYLE = { display: "contents" } as const

export type HydrateWhen = "load" | "visible" | "idle"

export interface IslandRenderArgs {
  name: string
  hydrate: HydrateWhen
  props: Record<string, unknown>
  /** The component rendered as the content of its own island. */
  renderContent: (props: Record<string, unknown>) => ReactElement
}

export type IslandRenderer = (args: IslandRenderArgs) => ReactElement

export const IslandRendererContext = createContext<IslandRenderer | null>(null)

// True inside an island's tree. A nested island() renders its component plainly: the outer
// island hydrates (and re-renders) that whole subtree itself. Hosts set it when hydrating.
export const InsideIsland = createContext(false)

// Returns the type it's given, so call sites keep the component's own prop types.
// oxlint-disable-next-line typescript/no-explicit-any
export const island = <T extends JSXElementConstructor<any>>(
  name: string,
  Component: T,
  // Required, so every island states when it hydrates.
  { hydrate }: { hydrate: HydrateWhen },
): T => {
  const Inner = Component as unknown as ComponentType<Record<string, unknown>>
  const renderContent = (props: Record<string, unknown>) =>
    createElement(
      InsideIsland.Provider,
      { value: true },
      createElement(Inner, props),
    )

  const Island = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const nested = useContext(InsideIsland)
    const render = useContext(IslandRendererContext)
    if (nested) return createElement(Inner, { ...props, ref })
    if (render) return render({ name, hydrate, props, renderContent })
    return createElement(
      ISLAND_TAG,
      { [ISLAND_ATTRS.component]: name, style: ISLAND_STYLE },
      renderContent({ ...props, ref }),
    )
  })
  Island.displayName = `Island(${name})`
  return Island as unknown as T
}
