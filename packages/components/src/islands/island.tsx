// island() marks a component as an island: an interactive part of an otherwise static page.
//
// It always renders inside an <isomer-island> marker, in Studio, Storybook and published sites,
// so every host gets the same DOM. A host that hydrates islands (apps/template-astro) provides
// IslandHost to render them with what it needs for hydration instead.
import type { ComponentType, ReactElement } from "react"
import { createContext, createElement, forwardRef, useContext } from "react"

import type { HydrateWhen } from "./protocol"
import type { IslandName } from "./registry"
import { ISLAND_TAG, islandAttributes } from "./protocol"

/** True inside an island's tree. An island() nested in there is part of that island. */
export const InsideIsland = createContext(false)

export interface HostIslandProps {
  name: IslandName
  hydrate: HydrateWhen
  Component: ComponentType<Record<string, unknown>>
  props: Record<string, unknown>
}

/** Provided by a host that hydrates islands, to render each one its own way. */
export const IslandHost = createContext<
  ((island: HostIslandProps) => ReactElement) | null
>(null)

/** An island's own tree. Hosts render this when serializing or hydrating an island. */
export const IslandContent = <P extends object>({
  Component,
  props,
}: {
  Component: ComponentType<P>
  props: P
}) => (
  <InsideIsland.Provider value={true}>
    <Component {...props} />
  </InsideIsland.Provider>
)

export const island = <P extends object>(
  name: IslandName,
  Component: ComponentType<P>,
  // Required, so every island states when it hydrates (see HydrateWhen).
  { hydrate }: { hydrate: HydrateWhen },
) => {
  const Island = forwardRef<unknown, P>((ownProps, ref) => {
    const props = { ...ownProps, ref } as P
    const insideIsland = useContext(InsideIsland)
    const renderForHost = useContext(IslandHost)

    // Part of a parent island, which hydrates this component along with everything else in it.
    if (insideIsland) return <Component {...props} />

    // The host only passes props through (serialized, then back), so it sees them untyped.
    if (renderForHost)
      return renderForHost({
        name,
        hydrate,
        Component: Component as ComponentType<Record<string, unknown>>,
        props: ownProps as Record<string, unknown>,
      })

    return createElement(
      ISLAND_TAG,
      islandAttributes({ name }),
      <IslandContent Component={Component} props={props} />,
    )
  })
  Island.displayName = `Island(${name})`
  return Island
}
