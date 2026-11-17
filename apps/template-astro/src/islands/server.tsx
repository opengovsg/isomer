import type { IslandRenderArgs } from "@opengovsg/isomer-components/islands"
// Server half of this site's islands runtime. Wrap the rendered tree in <IslandServerProvider> and
// every island() from @opengovsg/isomer-components renders as:
//
//   <isomer-island data-component="NavbarClient" data-hydrate="load"
//                  data-island-id=":R1:" data-props='{"items":[...]}'>
//     …the component's server-rendered HTML…
//   </isomer-island>
//
// Props that are server-rendered React nodes (e.g. `children`) can't be JSON, so they are rendered
// once into <isomer-slot data-slot="…"> and serialized as { "$slot": "…" }. The browser reuses that
// HTML as-is (same idea as Astro's slots).
import type { PropsWithChildren, ReactNode } from "react"
import {
  InsideIsland,
  ISLAND_ATTRS,
  ISLAND_STYLE,
  ISLAND_TAG,
  IslandRendererContext,
  SLOT_KEY,
  SLOT_TAG,
} from "@opengovsg/isomer-components/islands"
import { createElement, isValidElement, useId } from "react"
import { renderToString } from "react-dom/server"

export type IslandJson =
  | string
  | number
  | boolean
  | null
  | IslandJson[]
  | { [key: string]: IslandJson }

type Props = Record<string, unknown>

const isReactNode = (value: unknown) =>
  isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))

const isPlainObject = (value: object): value is Props =>
  Object.getPrototypeOf(value) === Object.prototype

// Slot contents are ordinary server-rendered markup, so islands inside them are islands again.
const Slot = ({ slotId, children }: { slotId: string; children?: ReactNode }) =>
  createElement(
    SLOT_TAG,
    { [ISLAND_ATTRS.slot]: slotId, style: ISLAND_STYLE },
    createElement(InsideIsland.Provider, { value: false }, children),
  )

/**
 * Splits props into what the browser gets (JSON, with { $slot } placeholders) and what the
 * server renders (the same props, with each React node wrapped in a <Slot>).
 */
const splitProps = (props: Props, islandId: string, name: string) => {
  let slotCount = 0

  // Returns [browser JSON (undefined = omit), server value].
  const visit = (
    value: unknown,
    path: string,
  ): [IslandJson | undefined, unknown] => {
    if (value === undefined || value === null) return [value, value]
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      return [value, value]
    if (isReactNode(value)) {
      const slotId = `${islandId}.${slotCount++}`
      return [
        { [SLOT_KEY]: slotId },
        createElement(Slot, { slotId }, value as ReactNode),
      ]
    }
    if (value instanceof Date) return [value.toISOString(), value]
    if (Array.isArray(value)) {
      const pairs = value.map((item, i) => visit(item, `${path}[${i}]`))
      return [
        pairs.map(([json]) => json ?? null),
        pairs.map(([, live]) => live),
      ]
    }
    if (typeof value === "object" && isPlainObject(value)) {
      const json: Record<string, IslandJson> = {}
      const live: Props = {}
      for (const [key, item] of Object.entries(value)) {
        const [itemJson, itemLive] = visit(item, path ? `${path}.${key}` : key)
        if (itemJson !== undefined) json[key] = itemJson
        live[key] = itemLive
      }
      return [json, live]
    }
    throw new Error(
      `[isomer-islands] ${name}: prop "${path}" is not serializable (${typeof value})`,
    )
  }

  const [jsonProps, serverProps] = visit(props, "")
  return { jsonProps, serverProps: serverProps as Props }
}

const ServerIsland = ({
  name,
  hydrate,
  props,
  renderContent,
}: IslandRenderArgs) => {
  const islandId = useId()
  const { jsonProps, serverProps } = splitProps(props, islandId, name)

  // Rendered as a separate root with its own identifierPrefix, exactly like the browser hydrates
  // it, so useId values (react-aria depends on them) match between server and client.
  const html = renderToString(renderContent(serverProps), {
    identifierPrefix: islandId,
  })

  return createElement(ISLAND_TAG, {
    [ISLAND_ATTRS.component]: name,
    [ISLAND_ATTRS.hydrate]: hydrate,
    [ISLAND_ATTRS.islandId]: islandId,
    [ISLAND_ATTRS.props]: JSON.stringify(jsonProps),
    style: ISLAND_STYLE,
    dangerouslySetInnerHTML: { __html: html },
  })
}

const renderServerIsland = (args: IslandRenderArgs) =>
  createElement(ServerIsland, args)

export const IslandServerProvider = ({ children }: PropsWithChildren) =>
  createElement(
    IslandRendererContext.Provider,
    { value: renderServerIsland },
    children,
  )
